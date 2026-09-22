<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    //

    public function index()
    {
        //
        $roles = Role::all();
        return response()->json($roles);
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //

        $validate = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:255',
        ]);
        DB::beginTransaction();
        try {
            $role = Role::create($validate);
            DB::commit();
            return response()->json([
                'message' => 'Rol creado exitosamente',
                'role' => $role
            ], 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'message' => 'Error al crear el rol: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Display the specified resource.
     */
    /**
     * Show the form for editing the specified resource.
     */


    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
        $validate = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:255',
        ]);
        DB::beginTransaction();
        try {
            $role = Role::findOrFail($id);
            $role->update($validate);
            DB::commit();
            return response()->json(['message' => 'Rol actualizado exitosamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al actualizar el rol: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $role = Role::findOrFail($id);

        // Sin esta validación, borrar un rol en uso deja a esos usuarios con
        // role_id en NULL (la FK es ON DELETE SET NULL) en vez de fallar,
        // así que quedan sin permisos silenciosamente.
        if (User::where('role_id', $role->id)->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar el rol porque tiene usuarios asignados',
            ], 409);
        }

        try {
            DB::transaction(function () use ($role) {
                $role->delete();
            });
            return response()->json(['message' => 'Rol eliminado exitosamente']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al eliminar el rol: ' . $e->getMessage()], 500);
        }
    }
}
