<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        if (!$user->role) {
            return response()->json(['message' => 'No tienes un rol asignado'], 403);
        }

        if (!in_array($user->role->name, $roles)) {
            return response()->json(['message' => 'No tienes permisos para realizar esta acción'], 403);
        }

        return $next($request);
    }
}
