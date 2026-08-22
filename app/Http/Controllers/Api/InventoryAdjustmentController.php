<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\InventoryAdjustment;
use App\Models\Product;


class InventoryAdjustmentController extends Controller
{
    //
    public function index()
    {
        //
        $adjustments = InventoryAdjustment::with('product')->get();
        return response()->json($adjustments);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validate = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'adjustment_type' => 'required|in:addition,subtraction',
            'reason' => 'required|string|max:255',
        ]);

        $product = Product::findOrFail($request->product_id);

        // Validación extra para mermas/salidas
        if ($request->adjustment_type === 'subtraction' && $product->stock < $request->quantity) {
            return response()->json(['error' => 'No hay suficiente stock para realizar este ajuste (Stock actual: ' . $product->stock . ')'], 422);
        }

        // Usamos una transacción para asegurar la integridad de los datos
        DB::transaction(function () use ($validate, $product) {
            // Lógica condicional según el tipo de ajuste
            if ($validate['adjustment_type'] === 'addition') {
                $product->increment('stock', $validate['quantity']);
            } else {
                $product->decrement('stock', $validate['quantity']);
            }

            // Crear el registro
            InventoryAdjustment::create($validate);
        });

        return response()->json(['message' => 'Ajuste registrado y stock actualizado exitosamente']);
    }
    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
        $adjustment = InventoryAdjustment::findOrFail($id);
        return response()->json($adjustment);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validate = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'adjustment_type' => 'required|in:addition,subtraction',
            'reason' => 'required|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $adjustment = InventoryAdjustment::findOrFail($id);
            $product = Product::findOrFail($adjustment->product_id);

            // PASO 1: Revertir el ajuste VIEJO (usa $adjustment->adjustment_type y $adjustment->quantity)
            if ($adjustment->adjustment_type === 'addition') {
                $product->decrement('stock', $adjustment->quantity);
            } else {
                $product->increment('stock', $adjustment->quantity);
            }

            // PASO 2: Aplicar el ajuste NUEVO (usa $request->adjustment_type y $request->quantity)
            if ($request->adjustment_type === 'addition') {
                $product->increment('stock', $request->quantity);
            } else {
                // Validación extra para mermas/salidas
                if ($product->stock < $request->quantity) {
                    DB::rollBack();
                    return response()->json(['error' => 'No hay suficiente stock para realizar este ajuste (Stock actual: ' . $product->stock . ')'], 422);
                }
                $product->decrement('stock', $request->quantity);
            }

            // PASO 3: Actualizar el registro del ajuste con los datos nuevos
            $adjustment->update($validate);

            DB::commit();
            return response()->json(['message' => 'Ajuste actualizado exitosamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al actualizar el ajuste'], 500);
        }
    }



    public function destroy(string $id)
    {
        // Usar transacción para mantener consistencia
        try {
            DB::beginTransaction();

            $adjustment = InventoryAdjustment::findOrFail($id);
            $product = Product::findOrFail($adjustment->product_id);

            if ($adjustment->adjustment_type === 'addition') {
                $product->decrement('stock', $adjustment->quantity);
            } else {
                $product->increment('stock', $adjustment->quantity);
            }

            $adjustment->delete();

            DB::commit();

            return response()->json(['message' => 'Ajuste de inventario eliminado correctamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al eliminar el ajuste de inventario'], 500);
        }
    }
}
