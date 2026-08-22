<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ClientDebt;


class ClientDebtController extends Controller
{
    public function index()
    {
        $debts = ClientDebt::with('client')->orderBy('due_date', 'asc')->get();
        return response()->json([
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
            'client_id' => 'required|exists:clients,id',
            'sale_group_id' => 'nullable|string|size:36',
            'start_date' => 'required|date',
            'due_date' => 'required|date|after:start_date',
            'balance_due' => 'required|numeric|min:0.01',
            'original_amount' => 'nullable|numeric|min:0',
            'status' => 'required|in:pending,paid,overdue',
        ]);

        if (!isset($validated['original_amount']) || $validated['original_amount'] <= 0) {
            $validated['original_amount'] = $validated['balance_due'];
        }
        $debt = ClientDebt::create($validated);
        return response()->json([
            'message' => 'Deuda del cliente creada exitosamente',
            'data' => $debt
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $debt = ClientDebt::with('client')->findOrFail($id);
        return response()->json([
            'message' => 'Deuda encontrada',
            'data' => $debt
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $debt = ClientDebt::findOrFail($id);

        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'sale_group_id' => 'nullable|string|size:36',
            'start_date' => 'required|date',
            'due_date' => 'required|date|after:start_date',
            'balance_due' => 'required|numeric|min:0.01',
            'status' => 'required|in:pending,paid,overdue',
        ]);

        $debt->update($validated);

        return response()->json([
            'message' => 'Deuda del cliente actualizada exitosamente',
            'data' => $debt
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $debt = ClientDebt::findOrFail($id);

        // No permitir eliminar deudas pendientes
        if (in_array($debt->status, ['pending', 'overdue'])) {
            return response()->json([
                'message' => 'No se puede eliminar una deuda pendiente o vencida. Por favor, actualice el estado a pagada antes de eliminar.'
            ], 409);
        }

        $debt->delete();
        return response()->json([
            'message' => 'Deuda del cliente eliminada exitosamente'
        ], 200);
    }

    /**
     * Register a payment (full or partial) on a client debt.
     */
    public function pay(Request $request, string $id)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        $debt = ClientDebt::findOrFail($id);

        if ($debt->status === 'paid') {
            return response()->json(['message' => 'Esta deuda ya está pagada'], 400);
        }

        $newBalance = round($debt->balance_due - $validated['amount'], 2);

        if ($newBalance < 0) {
            return response()->json(['message' => 'El monto excede el saldo pendiente'], 422);
        }

        $debt->update([
            'balance_due' => $newBalance,
            'status' => $newBalance <= 0 ? 'paid' : $debt->status,
        ]);

        return response()->json([
            'message' => $newBalance <= 0 ? 'Deuda liquidada completamente' : 'Pago registrado exitosamente',
            'data' => $debt->fresh('client'),
            'remaining' => $newBalance,
        ], 200);
    }
}
