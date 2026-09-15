<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sale;
use App\Models\Product;
use App\Models\ProductSaleUnit;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;


class SaleController extends Controller
{
    //
    public function index()
    {
        $sales = Sale::with(['product', 'employee', 'client'])->orderBy('created_at', 'desc')->get();
        return response()->json(['message' => 'ventas disponibles', 'data' => $sales], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'products' => 'required|array|min:1',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.sale_unit_type' => 'nullable|string|in:unit,package,weight',
            'products.*.quantity' => 'required_unless:products.*.sale_unit_type,weight|integer|min:1',
            'products.*.weight_grams' => 'required_if:products.*.sale_unit_type,weight|integer|min:1',
            'client_id' => 'nullable|exists:clients,id',
            'payment_method' => 'required|in:cash,card,mixed,credit,transfer',
            'cash_amount' => 'required_if:payment_method,cash,mixed|numeric|min:0',
            'card_amount' => 'required_if:payment_method,card,mixed|numeric|min:0',
            'card_reference' => 'nullable|string|max:50',
            'transfer_amount' => 'required_if:payment_method,transfer|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $employee = auth()->user()->employee;
            if (!$employee) {
                DB::rollBack();
                return response()->json(['message' => 'No se encontró el empleado asociado al usuario autenticado'], 404);
            }

            // El turno de caja ya NO se recibe del cliente — el backend resuelve
            // el turno activo del empleado autenticado, evitando ventas contra
            // turnos cerrados o equivocados.
            $turnoActivo = \App\Models\CashRegister::where('employee_id', $employee->id)
                ->whereNull('closed_at')
                ->first();

            if (!$turnoActivo) {
                DB::rollBack();
                return response()->json(['message' => 'No tienes un turno de caja abierto. Abre un turno antes de vender.'], 400);
            }

            // 1. Cargar productos, validar stock y calcular el total de cada línea
            $lines = [];
            $ticketTotal = 0;

            foreach ($validated['products'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $saleUnitType = $item['sale_unit_type'] ?? 'unit';

                if ($saleUnitType === 'weight') {
                    // Para venta por peso, el stock del producto se mantiene en gramos
                    // y el precio se toma de su ProductSaleUnit (unit_price = precio por kg),
                    // no del precio fijo por pieza en products.price.
                    $weightGrams = (int) $item['weight_grams'];

                    $saleUnit = ProductSaleUnit::where('product_id', $product->id)
                        ->where('unit_type', 'weight')
                        ->first();

                    if (!$saleUnit) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "{$product->name} no tiene un precio por peso configurado"
                        ], 422);
                    }

                    if ($product->stock < $weightGrams) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "No hay suficiente stock de {$product->name} (disponible: {$product->stock}g)"
                        ], 400);
                    }

                    $unitPrice = $saleUnit->unit_price;
                    $lineQuantity = $weightGrams;
                    $lineTotal = round(($unitPrice / 1000) * $weightGrams, 2);
                } else {
                    if ($product->stock < $item['quantity']) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "No hay suficiente stock de {$product->name} (disponible: {$product->stock})"
                        ], 400);
                    }

                    $unitPrice = $product->price;
                    $lineQuantity = $item['quantity'];
                    $lineTotal = $unitPrice * $lineQuantity;
                }

                $ticketTotal += $lineTotal;

                $lines[] = [
                    'product' => $product,
                    'quantity' => $lineQuantity,
                    'unit_price' => $unitPrice,
                    'sale_unit_type' => $saleUnitType,
                    'total_price' => $lineTotal,
                ];
            }

            // 2. Validar que el pago cubra el total (RF-14)
            $cashAmount = $validated['cash_amount'] ?? 0;
            $cardAmount = $validated['card_amount'] ?? 0;
            $transferAmount = $validated['transfer_amount'] ?? 0;

            if ($validated['payment_method'] !== 'credit') {
                $pagado = $cashAmount + $cardAmount + $transferAmount;
                if ($pagado < $ticketTotal) {
                    DB::rollBack();
                    return response()->json(['message' => 'El monto pagado no cubre el total de la venta'], 422);
                }
            } else {
                $pagado = 0;
                $cashAmount = 0;
                $cardAmount = 0;
                $transferAmount = 0;
            }

            $changeAmount = round(max($pagado - $ticketTotal, 0), 2);
            $cashCobrado = round($cashAmount - $changeAmount, 2);
            $cardCobrado = round($cardAmount, 2);
            $transferCobrado = round($transferAmount, 2);

            // 3. Identificador único para agrupar el ticket
            $saleGroupId = (string) Str::uuid();
            $createdSales = [];
            $sumaCashAsignada = 0;
            $sumaCardAsignada = 0;
            $sumaTransferAsignada = 0;
            $lastIndex = count($lines) - 1;

            foreach ($lines as $i => $line) {
                $proportion = $ticketTotal > 0 ? $line['total_price'] / $ticketTotal : 0;

                if ($i === $lastIndex) {
                    $lineCash = round($cashCobrado - $sumaCashAsignada, 2);
                    $lineCard = round($cardCobrado - $sumaCardAsignada, 2);
                    $lineTransfer = round($transferCobrado - $sumaTransferAsignada, 2);
                } else {
                    $lineCash = round($cashCobrado * $proportion, 2);
                    $lineCard = round($cardCobrado * $proportion, 2);
                    $lineTransfer = round($transferCobrado * $proportion, 2);
                    $sumaCashAsignada += $lineCash;
                    $sumaCardAsignada += $lineCard;
                    $sumaTransferAsignada += $lineTransfer;
                }

                $sale = Sale::create([
                    'sale_group_id' => $saleGroupId,
                    'product_id' => $line['product']->id,
                    'quantity' => $line['quantity'],
                    'unit_type' => $line['sale_unit_type'],
                    'unit_price' => $line['unit_price'],
                    'total_price' => $line['total_price'],
                    'employee_id' => $employee->id,
                    'client_id' => $validated['client_id'] ?? null,
                    'cash_register_id' => $turnoActivo->id,
                    'payment_method' => $validated['payment_method'],
                    'cash_amount' => $lineCash,
                    'card_amount' => $lineCard,
                    'transfer_amount' => $lineTransfer,
                    'card_reference' => $validated['card_reference'] ?? null,
                    'change_amount' => $i === $lastIndex ? $changeAmount : 0,
                    'status' => 'completed',
                ]);

                $line['product']->decrement('stock', $line['quantity']);
                $createdSales[] = $sale;
            }

            DB::commit();
            try {
                Log::info('Venta registrada: ' . $saleGroupId);
            } catch (\Throwable $e) {
                // Un fallo de logging nunca debe afectar la respuesta al cliente.
            }

            return response()->json([
                'message' => 'Venta registrada exitosamente',
                'sale_group_id' => $saleGroupId,
                'total' => $ticketTotal,
                'change_amount' => $changeAmount,
                'data' => $createdSales,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al registrar venta: ' . $e->getMessage());
            return response()->json(['message' => 'Error al registrar la venta: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $sale = Sale::with(['product', 'employee', 'client'])->findOrFail($id);
        return response()->json(['message' => 'Venta encontrada', 'data' => $sale], 200);
    }


    /**
     * Cambia el cliente asociado a TODAS las líneas de un ticket (sale_group_id).
     * El cliente no afecta precios ni pagos, así que no requiere recalcular nada.
     */
    public function updateClient(Request $request, string $saleGroupId)
    {
        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
        ]);

        $lineas = Sale::where('sale_group_id', $saleGroupId)->get();

        if ($lineas->isEmpty()) {
            return response()->json(['message' => 'No se encontró ningún ticket con ese identificador'], 404);
        }

        Sale::where('sale_group_id', $saleGroupId)->update(['client_id' => $validated['client_id'] ?? null]);

        return response()->json(['message' => 'Cliente actualizado exitosamente']);
    }

    /**
     * Update the specified resource in storage.
     */
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'sale_unit_type' => 'nullable|string|in:unit,package,weight',
            'quantity' => 'required_unless:sale_unit_type,weight|integer|min:1',
            'weight_grams' => 'required_if:sale_unit_type,weight|integer|min:1',
            'additional_cash' => 'nullable|numeric|min:0',
            'additional_card' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            // lockForUpdate() bloquea esta fila en la base de datos mientras dura
            // la transacción: si otra petición llega casi al mismo tiempo sobre
            // la misma venta, espera a que esta termine en vez de leer datos
            // que están a punto de cambiar (evita condiciones de carrera).
            $sale = Sale::lockForUpdate()->findOrFail($id);

            if ($sale->isCancelled()) {
                DB::rollBack();
                return response()->json(['message' => 'No se puede editar una venta cancelada'], 400);
            }

            $oldProduct = Product::findOrFail($sale->product_id);
            $newProduct = Product::findOrFail($validated['product_id']);

            // Devolver stock del producto anterior (la cantidad ya está en la unidad
            // en que se vendió originalmente: piezas o gramos si era venta por peso).
            $oldProduct->increment('stock', $sale->quantity);

            $saleUnitType = $validated['sale_unit_type'] ?? 'unit';

            if ($saleUnitType === 'weight') {
                // Igual que en store(): el precio se toma de ProductSaleUnit (por kg)
                // y la cantidad/stock se manejan en gramos, no en piezas.
                $weightGrams = (int) $validated['weight_grams'];

                $saleUnit = ProductSaleUnit::where('product_id', $newProduct->id)
                    ->where('unit_type', 'weight')
                    ->first();

                if (!$saleUnit) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "{$newProduct->name} no tiene un precio por peso configurado"
                    ], 422);
                }

                if ($newProduct->stock < $weightGrams) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "No hay suficiente stock de {$newProduct->name} (disponible: {$newProduct->stock}g)"
                    ], 400);
                }
                $newProduct->decrement('stock', $weightGrams);

                $newQuantity = $weightGrams;
                $newUnitPrice = $saleUnit->unit_price;
                $newLineTotal = round(($newUnitPrice / 1000) * $weightGrams, 2);
            } else {
                // Verificar stock del nuevo producto
                if ($newProduct->stock < $validated['quantity']) {
                    DB::rollBack();
                    return response()->json(['message' => 'No hay suficiente stock disponible'], 400);
                }
                $newProduct->decrement('stock', $validated['quantity']);

                $newQuantity = $validated['quantity'];
                $newUnitPrice = $newProduct->price;
                $newLineTotal = $newUnitPrice * $newQuantity;
            }

            // Recalcular el ticket completo — también bloqueamos las líneas hermanas
            // del mismo grupo, por la misma razón: evitar que se lean a medio actualizar.
            $otrasLineas = Sale::where('sale_group_id', $sale->sale_group_id)
                ->where('id', '!=', $sale->id)
                ->lockForUpdate()
                ->get();

            // Cambio que YA se había entregado antes de esta edición (histórico del ticket)
            $cambioYaEntregadoAntes = round($sale->change_amount + $otrasLineas->sum('change_amount'), 2);

            $ticketTotal = $newLineTotal + $otrasLineas->sum('total_price');
            $cashTotalTicket = $sale->cash_amount + $otrasLineas->sum('cash_amount');
            $cardTotalTicket = $sale->card_amount + $otrasLineas->sum('card_amount');
            $yaPagado = $cashTotalTicket + $cardTotalTicket;

            $diferencia = round($ticketTotal - $yaPagado, 2);
            $cambioAEntregar = 0;

            if ($diferencia > 0) {
                // El nuevo producto es más caro: falta cobrar
                $extra = ($validated['additional_cash'] ?? 0) + ($validated['additional_card'] ?? 0);
                if ($extra < $diferencia) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "El nuevo producto cuesta más. Faltan \${$diferencia} por cobrar.",
                        'faltante' => $diferencia,
                    ], 422);
                }
                $cashTotalTicket += $validated['additional_cash'] ?? 0;
                $cardTotalTicket += $validated['additional_card'] ?? 0;
            } elseif ($diferencia < 0) {
                // El nuevo producto es más barato: hay que devolver cambio.
                // Se descuenta del efectivo primero (es lo que se puede devolver físicamente).
                $cambioAEntregar = abs($diferencia);
                $descuentoCash = min($cambioAEntregar, $cashTotalTicket);
                $cashTotalTicket -= $descuentoCash;
                $restante = $cambioAEntregar - $descuentoCash;
                if ($restante > 0) {
                    $cardTotalTicket -= $restante;
                }
            }

            // Actualizar la línea editada
            $sale->update([
                'product_id' => $newProduct->id,
                'quantity' => $newQuantity,
                'unit_type' => $saleUnitType,
                'unit_price' => $newUnitPrice,
                'total_price' => $newLineTotal,
                'cash_amount' => $ticketTotal > 0 ? round($cashTotalTicket * ($newLineTotal / $ticketTotal), 2) : 0,
                'card_amount' => $ticketTotal > 0 ? round($cardTotalTicket * ($newLineTotal / $ticketTotal), 2) : 0,
            ]);

            // Reprorratear el resto de las líneas del mismo ticket
            foreach ($otrasLineas as $otra) {
                $proportion = $ticketTotal > 0 ? $otra->total_price / $ticketTotal : 0;
                $otra->update([
                    'cash_amount' => round($cashTotalTicket * $proportion, 2),
                    'card_amount' => round($cardTotalTicket * $proportion, 2),
                ]);
            }

            // Solo reportar como "nuevo" el cambio que excede lo ya entregado antes de esta edición
            $cambioNuevoAEntregar = max(0, round($cambioAEntregar - $cambioYaEntregadoAntes, 2));

            DB::commit();
            return response()->json([
                'message' => 'Venta actualizada exitosamente',
                'data' => $sale->fresh(),
                'cambio_a_entregar' => $cambioNuevoAEntregar,
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al actualizar la venta: ' . $e->getMessage()], 500);
        }
    }

    private function cancelSaleLine(Sale $sale): array
    {
        if ($sale->isCancelled()) {
            return ['ok' => false, 'reason' => 'ya_cancelada'];
        }

        if ($sale->cancel()) {
            return ['ok' => true];
        }

        return ['ok' => false, 'reason' => 'error'];
    }

    public function cancel(string $id)
    {
        $sale = Sale::findOrFail($id);

        DB::beginTransaction();
        try {
            $resultado = $this->cancelSaleLine($sale);

            if (!$resultado['ok'] && $resultado['reason'] === 'ya_cancelada') {
                DB::rollBack();
                return response()->json(['message' => 'Esta venta ya está cancelada'], 400);
            }
            if (!$resultado['ok']) {
                DB::rollBack();
                return response()->json(['message' => 'No se pudo cancelar la venta'], 400);
            }

            DB::commit();
            Log::info('Venta cancelada: ' . $sale->id);
            return response()->json(['message' => 'Venta cancelada exitosamente. Stock devuelto al inventario.'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al cancelar venta: ' . $e->getMessage());
            return response()->json(['message' => 'Error al cancelar la venta: ' . $e->getMessage()], 500);
        }
    }

    public function cancelGroup(string $saleGroupId)
    {
        $lineas = Sale::where('sale_group_id', $saleGroupId)->get();

        if ($lineas->isEmpty()) {
            return response()->json(['message' => 'No se encontró ningún ticket con ese identificador'], 404);
        }

        DB::beginTransaction();
        try {
            $canceladas = 0;
            $yaCanceladas = 0;

            foreach ($lineas as $sale) {
                $resultado = $this->cancelSaleLine($sale);
                if ($resultado['ok']) {
                    $canceladas++;
                } elseif ($resultado['reason'] === 'ya_cancelada') {
                    $yaCanceladas++;
                }
            }

            DB::commit();
            Log::info("Ticket cancelado: {$saleGroupId} ({$canceladas} líneas canceladas, {$yaCanceladas} ya lo estaban)");

            return response()->json([
                'message' => 'Ticket cancelado exitosamente. Stock devuelto al inventario.',
                'lineas_canceladas' => $canceladas,
                'lineas_ya_canceladas_previamente' => $yaCanceladas,
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al cancelar ticket: ' . $e->getMessage());
            return response()->json(['message' => 'Error al cancelar el ticket: ' . $e->getMessage()], 500);
        }
    }
    /**
     * REVERTIR CANCELACIÓN (opcional)
     */
    public function revert(string $id)
    {
        // Solo administradores pueden revertir
        if (!auth()->user()->isAdmin()) {
            return response()->json(['message' => 'No tienes permisos para revertir ventas canceladas'], 403);
        }

        $sale = Sale::findOrFail($id);

        if (!$sale->isCancelled()) {
            return response()->json(['message' => 'Esta venta no está cancelada'], 400);
        }

        DB::beginTransaction();
        try {
            // Revertir cancelación
            if ($sale->revert()) {
                DB::commit();
                Log::info('Venta revertida: ' . $sale->id);
                return response()->json(['message' => 'Venta revertida exitosamente. Stock ajustado.'], 200);
            } else {
                DB::rollBack();
                return response()->json(['message' => 'No hay stock suficiente para revertir la cancelación'], 400);
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al revertir venta: ' . $e->getMessage());

            return response()->json(['message' => 'Error al revertir la venta: ' . $e->getMessage()], 500);
        }
    }



    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        DB::beginTransaction();
        try {
            $sale = Sale::findOrFail($id);

            // Solo devolver stock si la venta seguía activa (no se había cancelado ya)
            if (!$sale->isCancelled()) {
                $product = Product::findOrFail($sale->product_id);
                $product->increment('stock', $sale->quantity);
            }

            $sale->delete();

            DB::commit();
            return response()->json(['message' => 'Venta eliminada exitosamente'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al eliminar la venta: ' . $e->getMessage()], 500);
        }
    }
}
