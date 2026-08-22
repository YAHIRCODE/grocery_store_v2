<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ProviderFund;
use App\Models\SupplierNote;
use App\Models\SupplierDebt;
use App\Models\Supplier;

class ProviderFundController extends Controller
{
    //
    public function index(Request $request)
    {
$supplierDebts = Supplier::withSum(['debts' => function($query) {
    $query->whereIn('status', ['pending', 'overdue']);
}], 'amount')->get();

        $funds = ProviderFund::all();

        $notasPendientes = SupplierNote::with('supplier')
            ->where('status', 'pending')
            ->get()
            ->groupBy('supplier_id');

        return response()->json([
            'data' => $funds,
            'suppliers_pending' => $supplierDebts,
            'supplier_notes_pending' => $notasPendientes,
        ], 200);
    }

    public function show($id)
    {
        $fund = ProviderFund::find($id);
        if (!$fund) {
            return response()->json(['message' => 'Fondo de proveedor no encontrado'], 404);
        }
        return response()->json([
            'data' => $fund
        ], 200);
    }

    public function update(Request $request, $id)
    {
        $fund = ProviderFund::find($id);
        if (!$fund) {
            return response()->json(['message' => 'Fondo de proveedor no encontrado'], 404);
        }

        $validated = $request->validate([
            'defined_amount' => 'nullable|numeric|min:0',
            'extraction_limit' => 'nullable|numeric|min:0',
            'available_balance' => 'nullable|numeric|min:0',
        ]);

        $fund->update($validated);

        return response()->json([
            'message' => 'Fondo de proveedor actualizado exitosamente',
            'data' => $fund
        ], 200);
    }

    public function extract(Request $request, $id)
    {
        $fund = ProviderFund::find($id);
        if (!$fund) {
            return response()->json(['message' => 'Fondo de proveedor no encontrado'], 404);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'reason' => 'nullable|string|max:255',
        ]);

        if ($validated['amount'] > $fund->available_balance) {
            return response()->json(['message' => 'El monto a extraer excede el saldo disponible'], 400);
        }

        if ($validated['amount'] > $fund->extraction_limit) {
            return response()->json(['message' => 'El monto excede el límite de extracción autorizado'], 400);
        }

        $employee = auth()->user()->employee;
        if (!$employee) {
            return response()->json(['message' => 'No se encontró el empleado asociado al usuario autenticado'], 404);
        }

        \App\Models\ProviderFundMovement::create([
            'provider_fund_id' => $fund->id,
            'amount' => $validated['amount'],
            'type' => 'withdrawal',
            'employee_id' => $employee->id,
            'reason' => $validated['reason'] ?? null,
        ]);

        $fund->decrement('available_balance', $validated['amount']);

        return response()->json([
            'message' => 'Monto extraído exitosamente',
            'data' => $fund->fresh(),
        ], 200);
    }


}
