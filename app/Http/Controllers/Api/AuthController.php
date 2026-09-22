<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $credencialesCorrectas = Auth::attempt($validated);
        if (!$credencialesCorrectas) {
            return response()->json(['message' => 'Credenciales incorrectas'], 401);
        }

        // Rota el ID de sesión al autenticar (previene fijación de sesión).
        // La cookie de sesión HttpOnly es ahora el único mecanismo de auth:
        // ya no se emite ni se devuelve un token Bearer en el body.
        $request->session()->regenerate();

        $user = Auth::user();

        return response()->json([
            'message' => 'Usuario autenticado',
            'user' => $user->load(['role', 'employee']),
        ], 200);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load(['role', 'employee']));
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }
}