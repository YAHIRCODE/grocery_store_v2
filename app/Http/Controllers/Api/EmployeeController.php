<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EmployeeController extends Controller
{
    //
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $employees = Employee::with('user.role')->get();
        return response()->json($employees);
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
            'email' => 'required|email|unique:employees,email',
            'payroll_id' => 'required|string|max:255|unique:employees,payroll_id',
            'hourly_rate' => 'required|numeric|min:0.01',
            'role_id' => 'required|exists:roles,id',
        ]);

        DB::beginTransaction();
        $temporaryPassword = Str::random(12);
        try {
            $user = User::create([
                'name' => $validated['first_name'] . ' ' . $validated['last_name'],
                'email' => $validated['email'],
                'password' => bcrypt($temporaryPassword),
                'role_id' => $validated['role_id'],
            ]);

            Employee::create([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'email' => $validated['email'],
                'payroll_id' => $validated['payroll_id'],
                'hourly_rate' => $validated['hourly_rate'],
                'user_id' => $user->id,
            ]);

            DB::commit();
            return response()->json([
                'message' => 'Empleado creado exitosamente',
                'temporary_password' => $temporaryPassword, // 3. Devolverla al Admin
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al crear empleado: ' . $e->getMessage()], 400);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $employee = Employee::with('user.role')->findOrFail($id);
        return response()->json($employee);
    }

    /**
     * Show the form for editing the specified resource.
     */

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:employees,email,' . $id,
            'payroll_id' => 'required|string|max:255|unique:employees,payroll_id,' . $id,
            'hourly_rate' => 'required|numeric|min:0.01',
            'role_id' => 'required|exists:roles,id',
        ]);
        DB::beginTransaction();
        try {
            $employee->user()->update([
                'name' => $validated['first_name'] . ' ' . $validated['last_name'],
                'email' => $validated['email'],
                'role_id' => $validated['role_id'],
            ]);

            unset($validated['role_id']);
            $employee->update($validated);

            DB::commit();
            return response()->json(['message' => 'Empleado actualizado exitosamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al actualizar empleado: ' . $e->getMessage()], 400);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $employee = Employee::findOrFail($id);

        $ventasCount = $employee->sales()->count();
        if ($ventasCount > 0) {
            return response()->json(['message' => "No se puede eliminar este empleado porque tiene {$ventasCount} venta(s) registrada(s)."], 400);
        }
        $employee->delete();

        return response()->json(['message' => 'Empleado eliminado exitosamente']);
    }
}
