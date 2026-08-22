<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Product;
use App\Models\Client;
use App\Models\ClientDebt;
use App\Models\Category;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Reúne los datos del dashboard. Se comparte entre PDF y CSV
     * para garantizar que ambos reportes muestren exactamente lo mismo.
     */
    private function datosDashboard(): array
    {
        // Se cuentan TICKETS únicos, no líneas — debe coincidir con el
        // criterio de DashboardController::index(), de lo contrario el
        // reporte y la pantalla mostrarían números distintos.
        $ventasHoy = Sale::whereDate('created_at', Carbon::today())
            ->where('status', 'completed')
            ->distinct('sale_group_id')
            ->count('sale_group_id');

        $ventasHoyTotal = Sale::whereDate('created_at', Carbon::today())
            ->where('status', 'completed')->sum('total_price');

        $productosBajoStock = Product::whereColumn('stock', '<=', 'min_stock')
            ->orderBy('stock', 'asc')->get();

        $deudasPendientes = ClientDebt::whereIn('status', ['pending', 'overdue'])
            ->sum('balance_due');

        $clientesActivos = Client::count();

        // Ventas de los últimos 7 días (solo completadas).
        // startOfDay() en el límite inferior: sin él, el rango arrancaría
        // a la hora actual de hace 6 días y dejaría fuera las ventas
        // tempranas de ese primer día.
        $desde = Carbon::today()->subDays(6)->startOfDay();
        $hasta = Carbon::today()->endOfDay();

        $ventasPorDia = Sale::where('status', 'completed')
            ->whereBetween('created_at', [$desde, $hasta])
            ->selectRaw('DATE(created_at) as fecha, SUM(total_price) as total')
            ->groupBy('fecha')
            ->pluck('total', 'fecha');

        $serie = [];
        for ($i = 6; $i >= 0; $i--) {
            $f = Carbon::today()->subDays($i);
            $serie[] = [
                'fecha' => $f->format('d/m/Y'),
                'etiqueta' => $f->format('d M'),
                'total' => (float) ($ventasPorDia[$f->format('Y-m-d')] ?? 0),
            ];
        }

        // Detalle por LÍNEA (no agrupado por ticket): en el CSV conviene
        // el detalle producto por producto para que el dueño pueda filtrar
        // y hacer tablas dinámicas en Excel.
        $ultimasVentas = Sale::with(['product', 'employee', 'client'])
            ->where('status', 'completed')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $categorias = Category::withCount('products')->get();

        return compact(
            'ventasHoy', 'ventasHoyTotal', 'productosBajoStock',
            'deudasPendientes', 'clientesActivos', 'serie',
            'ultimasVentas', 'categorias'
        );
    }

    /**
     * GET /reportes/dashboard/pdf
     * Reporte visual para imprimir o presentar.
     */
    public function dashboardPdf()
    {
        $data = $this->datosDashboard();
        $data['generado'] = Carbon::now()->format('d/m/Y H:i');
        $data['maxSerie'] = max(array_column($data['serie'], 'total')) ?: 1;

        $pdf = Pdf::loadView('pdfs.dashboard', $data)->setPaper('letter', 'portrait');

        return $pdf->download('dashboard_' . Carbon::now()->format('Y-m-d') . '.pdf');
    }

    /**
     * GET /reportes/dashboard/csv
     * Datos crudos para abrir en Excel y manipular.
     * Se transmite con streamDownload para no cargar todo en memoria.
     */
    public function dashboardCsv(): StreamedResponse
    {
        $data = $this->datosDashboard();
        $nombre = 'dashboard_' . Carbon::now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function () use ($data) {
            $out = fopen('php://output', 'w');

            // BOM UTF-8: sin esto Excel muestra mal los acentos (Ã³ en vez de ó)
            fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Indica a Excel que el separador de columnas es la coma
            fwrite($out, "sep=,\n");

            fputcsv($out, ['ABARROTES KATY — REPORTE DE DASHBOARD']);
            fputcsv($out, ['Generado', Carbon::now()->format('d/m/Y H:i')]);
            fputcsv($out, []);

            fputcsv($out, ['RESUMEN DEL DÍA']);
            fputcsv($out, ['Concepto', 'Valor']);
            fputcsv($out, ['Tickets vendidos hoy', $data['ventasHoy']]);
            fputcsv($out, ['Total vendido hoy', number_format($data['ventasHoyTotal'], 2, '.', '')]);
            fputcsv($out, ['Productos con bajo stock', $data['productosBajoStock']->count()]);
            fputcsv($out, ['Deudas pendientes de clientes', number_format($data['deudasPendientes'], 2, '.', '')]);
            fputcsv($out, ['Clientes registrados', $data['clientesActivos']]);
            fputcsv($out, []);

            fputcsv($out, ['VENTAS DE LOS ÚLTIMOS 7 DÍAS']);
            fputcsv($out, ['Fecha', 'Total vendido']);
            foreach ($data['serie'] as $d) {
                fputcsv($out, [$d['fecha'], number_format($d['total'], 2, '.', '')]);
            }
            fputcsv($out, []);

            fputcsv($out, ['PRODUCTOS CON BAJO STOCK']);
            fputcsv($out, ['Producto', 'Stock actual', 'Stock mínimo', 'Faltante']);
            foreach ($data['productosBajoStock'] as $p) {
                fputcsv($out, [$p->name, $p->stock, $p->min_stock, max(0, $p->min_stock - $p->stock)]);
            }
            fputcsv($out, []);

            fputcsv($out, ['PRODUCTOS POR CATEGORÍA']);
            fputcsv($out, ['Categoría', 'Número de productos']);
            foreach ($data['categorias'] as $c) {
                fputcsv($out, [$c->name, $c->products_count]);
            }
            fputcsv($out, []);

            fputcsv($out, ['ÚLTIMAS VENTAS (detalle por producto)']);
            fputcsv($out, ['Fecha', 'Ticket', 'Producto', 'Cantidad', 'Total', 'Efectivo', 'Tarjeta', 'Método', 'Empleado']);
            foreach ($data['ultimasVentas'] as $v) {
                fputcsv($out, [
                    $v->created_at->format('d/m/Y H:i'),
                    $v->sale_group_id ? substr($v->sale_group_id, 0, 8) : '—',
                    $v->product->name ?? '—',
                    $v->quantity,
                    number_format($v->total_price, 2, '.', ''),
                    number_format($v->cash_amount, 2, '.', ''),
                    number_format($v->card_amount, 2, '.', ''),
                    $v->payment_method ?? '—',
                    $v->employee->first_name ?? '—',
                ]);
            }

            fclose($out);
        }, $nombre, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
