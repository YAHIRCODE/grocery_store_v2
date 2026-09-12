<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Client;

class ClientController extends Controller
{
    //
      public function index()
    {
        $clients = Client::with('debts')->orderBy('first_name', 'asc')->get();
        return response()->json([
            'message' => 'Lista de clientes',
            'data' => $clients
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
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:clients,email',
            'phone' => 'required|string|max:20',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $Client = Client::create($validated);
        return response()->json([
            'message' => 'cliente creado exitosamente',
            'data' => $Client
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $client = Client::with('debts')->findOrFail($id);
        return response()->json([
            'message' => 'Cliente encontrado',
            'data' => $client
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
        $client = Client::findOrFail($id);
        
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:clients,email,' . $id,
            'phone' => 'required|string|max:20',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $client->update($validated);
        
        return response()->json([
            'message' => 'Cliente actualizado exitosamente',
            'data' => $client
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $client = Client::findOrFail($id);
        
        // Verificar si el cliente tiene deudas pendientes
        if ($client->debts()->whereIn('status', ['pending', 'overdue'])->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar el cliente porque tiene deudas pendientes',
            ], 400);
        }
        
        $client->delete();
        
        return response()->json([
            'message' => 'Cliente eliminado exitosamente',
            'data' => $client
        ], 200);
    }

    public function trashed()
    {
        $clients = Client::onlyTrashed()
            ->orderBy('deleted_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Clientes eliminados',
            'data' => $clients
        ], 200);
    }

    public function restore(string $id)
    {
        $client = Client::onlyTrashed()->findOrFail($id);
        $client->restore();

        return response()->json([
            'message' => 'Cliente restaurado exitosamente'
        ], 200);
    }

    public function forceDelete(string $id)
    {
        $client = Client::onlyTrashed()->findOrFail($id);

        if ($client->debts()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar permanentemente porque tiene deudas registradas'
            ], 400);
        }

        $client->forceDelete();

        return response()->json([
            'message' => 'Cliente eliminado permanentemente de la base de datos'
        ], 200);
    }
}
