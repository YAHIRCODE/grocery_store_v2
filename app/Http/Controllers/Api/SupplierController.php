<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SupplierDebt;
use App\Models\Supplier;

class SupplierController extends Controller
{
    /**
     * Display a listing of the resource.
     */
public function index()
    {
        $suppliers = Supplier::orderBy('company_name', 'asc')->get();
        return response()->json([
            'message' => 'Lista de proveedores',
            'data' => $suppliers
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
            'company_name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255|unique:suppliers,email',
        ]);

        $supplier = Supplier::create($validated);
        return response()->json([
            'message' => 'Proveedor creado exitosamente',
            'data' => $supplier
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $supplier = Supplier::with('debts')->findOrFail($id);
        return response()->json([
            'message' => 'Proveedor encontrado',
            'data' => $supplier
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
        $supplier = Supplier::findOrFail($id);
        
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255|unique:suppliers,email,' . $id,
        ]);

        $supplier->update($validated);
        
        return response()->json([
            'message' => 'Proveedor actualizado exitosamente',
            'data' => $supplier
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
public function destroy(string $id)
{
    $supplier = Supplier::findOrFail($id);

    // Verificar si el proveedor tiene notas de trato registradas
    if ($supplier->supplierNotes()->exists()) {
        return response()->json([
            'message' => 'No se puede eliminar el proveedor porque tiene notas de trato registradas',
        ], 409);
    }

    // Verificar si el proveedor tiene deudas pendientes
    if ($supplier->debts()->whereIn('status', ['pending', 'overdue'])->exists()) {
        return response()->json([
            'message' => 'No se puede eliminar el proveedor porque tiene deudas pendientes',
        ], 400);
    }

    $supplier->delete();
    return response()->json([
        'message' => 'Proveedor eliminado exitosamente',
        'data' => $supplier
    ], 200);
}
}
