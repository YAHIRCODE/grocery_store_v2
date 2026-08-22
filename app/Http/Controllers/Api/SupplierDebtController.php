<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupplierDebt;
use Illuminate\Http\Request;

class SupplierDebtController extends Controller
{
    //
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Obtener todas las deudas con su proveedor asociado
        $debts = SupplierDebt::with('supplier')->get();
        return response()->json([
            'message' => 'Lista de deudas de proveedores',
            'data' => $debts
        ], 200);
    }

    /**
     * Show the form for creating a new resource.
     */


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'amount' => 'required|numeric|min:0.01',
            'status' => 'required|in:pending,paid,overdue',
        ]);

        $debt = SupplierDebt::create($validated);
        return response()->json([
            'message' => 'Deuda del proveedor creada exitosamente',
            'data' => $debt
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $debt = SupplierDebt::with('supplier')->findOrFail($id);
        return response()->json([
            'message' => 'Deuda encontrada',
            'data' => $debt
        ], 200);
    }

    /**
     * Show the form for editing the specified resource.
     */

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $debt = SupplierDebt::findOrFail($id);

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'amount' => 'required|numeric|min:0.01',
            'status' => 'required|in:pending,paid,overdue',
        ]);

        $debt->update($validated);
        return response()->json([
            'message' => 'Deuda del proveedor actualizada exitosamente',
            'data' => $debt
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $debt = SupplierDebt::findOrFail($id);

        // No permitir eliminar deudas pendientes o vencidas
        if (in_array($debt->status, ['pending', 'overdue'])) {
            return response()->json([
                'message' => 'No se puede eliminar una deuda pendiente o vencida.'
            ], 409);
        }

        $debt->delete();
        return response()->json([
            'message' => 'Deuda del proveedor eliminada exitosamente'
        ], 200);
    }
}
