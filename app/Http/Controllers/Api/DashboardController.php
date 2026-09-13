<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sale;
use App\Models\Product;
use App\Models\Client;
use App\Models\ClientDebt;
use App\Models\Category;
use App\Models\SupplierDebt;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // 1. Estadísticas básicas.
        // Se cuentan TICKETS únicos (sale_group_id), no líneas: un ticket
        // con 3 productos es UNA venta, no tres.
        // El filtro status=completed excluye las ventas canceladas: sin él,
        // una devolución seguiría contando como ingreso.
        $ventasHoy = Sale::whereDate('created_at', Carbon::today())
            ->where('status', 'completed')
            ->distinct('sale_group_id')
            ->count('sale_group_id');

        $ventasHoyTotal = Sale::whereDate('created_at', Carbon::today())
            ->where('status', 'completed')
            ->sum('total_price');

        // Las líneas vendidas por peso guardan gramos en sales.quantity y
        // products.purchase_price representa el costo por KILOGRAMO para esos
        // productos, así que su costo se calcula distinto al de unidad/paquete.
        $costoVentasHoy = Sale::where('sales.status', 'completed')
            ->whereDate('sales.created_at', Carbon::today())
            ->join('products', 'sales.product_id', '=', 'products.id')
            ->selectRaw("SUM(CASE WHEN sales.unit_type = 'weight' THEN (products.purchase_price / 1000) * sales.quantity ELSE products.purchase_price * sales.quantity END) as total")
            ->value('total') ?? 0;

        $productosConBajoStock = Product::whereColumn('stock', '<=', 'min_stock')->count();
        $deudasPendientes = ClientDebt::whereIn('status', ['pending', 'overdue'])->sum('balance_due');
        $clientesActivos = Client::count();

        // 2. Series de los últimos 7 días.
        // startOfDay() en el límite inferior: sin él el rango arrancaría a la
        // hora actual de hace 6 días, dejando fuera ventas tempranas.
        $diasLabels = [];
        $gananciasData = [];
        $gastosData = [];
        $deudas_Proveedor = [];

        $desde = Carbon::today()->subDays(6)->startOfDay();
        $hasta = Carbon::today()->endOfDay();

        $ventas = Sale::where('status', 'completed')
            ->whereBetween('created_at', [$desde, $hasta])
            ->selectRaw('DATE(created_at) as fecha, SUM(total_price) as total')
            ->groupBy('fecha')
            ->pluck('total', 'fecha');

        $deudas = SupplierDebt::whereBetween('created_at', [$desde, $hasta])
            ->selectRaw('DATE(created_at) as fecha, SUM(amount) as total')
            ->groupBy('fecha')
            ->pluck('total', 'fecha');

        // El prefijo sales. es necesario aquí porque hay un join con products
        // y ambas tablas podrían tener columnas con el mismo nombre.
        $gastos = Sale::where('sales.status', 'completed')
            ->whereBetween('sales.created_at', [$desde, $hasta])
            ->join('products', 'sales.product_id', '=', 'products.id')
            ->selectRaw("DATE(sales.created_at) as fecha, SUM(CASE WHEN sales.unit_type = 'weight' THEN (products.purchase_price / 1000) * sales.quantity ELSE products.purchase_price * sales.quantity END) as total")
            ->groupBy('fecha')
            ->pluck('total', 'fecha');

        for ($i = 6; $i >= 0; $i--) {
            $fecha = Carbon::today()->subDays($i);
            $fechaKey = $fecha->format('Y-m-d');

            $diasLabels[] = $fecha->format('d M');
            $gananciasData[] = (float) ($ventas[$fechaKey] ?? 0);
            $deudas_Proveedor[] = (float) ($deudas[$fechaKey] ?? 0);
            $gastosData[] = (float) ($gastos[$fechaKey] ?? 0);
        }

        // 3. Inventario por categoría
        $categorias = Category::withCount('products')->get();
        $labelsCategorias = $categorias->pluck('name');
        $conteoProductos = $categorias->pluck('products_count');
        $totalProductos = $conteoProductos->sum();

        // 4. Últimos 5 TICKETS completos.
        // Primero se identifican los 5 grupos más recientes y luego se traen
        // TODAS sus líneas: si se limitara la consulta a N filas, el ticket
        // más antiguo del lote podría quedar cortado y mostrar un total menor
        // al real.
        $gruposRecientes = Sale::where('status', 'completed')
            ->whereNotNull('sale_group_id')
            ->orderBy('created_at', 'desc')
            ->pluck('sale_group_id')
            ->unique()
            ->take(5);

        $ultimasVentas = Sale::with(['product', 'employee', 'client'])
            ->where('status', 'completed')
            ->whereIn('sale_group_id', $gruposRecientes)
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('sale_group_id')
            ->map(function ($items) {
                $primerItem = $items->first();

                return [
                    'sale_group_id' => $primerItem->sale_group_id,
                    'fecha' => $primerItem->created_at->format('Y-m-d H:i:s'),
                    'total' => (float) $items->sum('total_price'),
                    'cash_amount' => (float) $items->sum('cash_amount'),
                    'card_amount' => (float) $items->sum('card_amount'),
                    'change_amount' => (float) $items->sum('change_amount'),
                    'payment_method' => $primerItem->payment_method,
                    'empleado' => $primerItem->employee
                        ? $primerItem->employee->first_name . ' ' . $primerItem->employee->last_name
                        : 'N/A',
                    // El modelo Client usa first_name / last_name, no 'name'.
                    'cliente' => $primerItem->client
                        ? $primerItem->client->first_name . ' ' . $primerItem->client->last_name
                        : 'Público General',
                    'items_count' => (int) $items->sum('quantity'),
                    'productos' => $items->map(function ($item) {
                        return [
                            'producto' => $item->product ? $item->product->name : 'N/A',
                            'cantidad' => $item->quantity,
                            'precio' => (float) $item->total_price,
                        ];
                    })->values(),
                ];
            })
            ->values();

        return response()->json([
            'message' => 'Dashboard',
            'ventasHoy' => $ventasHoy,
            'ventasHoyTotal' => (float) $ventasHoyTotal,
            'costoVentasHoy' => (float) $costoVentasHoy,
            'productosConBajoStock' => $productosConBajoStock,
            'deudasPendientes' => (float) $deudasPendientes,
            'clientesActivos' => $clientesActivos,
            'ultimasVentas' => $ultimasVentas,
            'diasLabels' => $diasLabels,
            'gananciasData' => $gananciasData,
            'gastosData' => $gastosData,
            'labelsCategorias' => $labelsCategorias,
            'conteoProductos' => $conteoProductos,
            'totalProductos' => $totalProductos,
            'ventas' => $ventas,
            'deudasProveedor' => $deudas_Proveedor,
        ]);
    }

public function reporteVentas()
{

    $perPage = 20;

    $gruposIds = Sale::where('status', 'completed')
        ->select('sale_group_id', DB::raw('MAX(created_at) as ultima_fecha'))
        ->groupBy('sale_group_id')
        ->orderByDesc('ultima_fecha')
        ->paginate($perPage);

    $ids = collect($gruposIds->items())->pluck('sale_group_id');

    $ventas = Sale::with(['product', 'employee', 'client'])
        ->where('status', 'completed')
        ->whereIn('sale_group_id', $ids)
        ->orderBy('created_at', 'desc')
        ->get();

    // Reconstruimos un paginador manualmente para conservar current_page,
    // last_page y total (ahora en TICKETS, no en líneas), que el frontend ya espera.
    $paginado = new \Illuminate\Pagination\LengthAwarePaginator(
        $ventas,
        $gruposIds->total(),
        $perPage,
        $gruposIds->currentPage(),
        ['path' => request()->url(), 'query' => request()->query()]
    );

    return response()->json([
        'message' => 'Reporte de ventas',
        'data' => $paginado
    ], 200);
}

    public function reporteProductos()
    {
        $productos = Product::with('category')
            ->orderBy('stock', 'asc')
            ->get();

        return response()->json([
            'message' => 'Reporte de productos',
            'data' => $productos
        ], 200);
    }

    public function reporteClientes()
    {
        $clientes = Client::withCount('debts')
            ->with('debts')
            ->get();

        return response()->json([
            'message' => 'Reporte de clientes',
            'data' => $clientes
        ], 200);
    }

    public function reporteDeudas()
    {
        $deudasClientes = ClientDebt::with('client')
            ->whereIn('status', ['pending', 'overdue'])
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json([
            'message' => 'Reporte de deudas de clientes',
            'data' => $deudasClientes
        ], 200);
    }
}
