<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SupplierNote;
use App\Models\SupplierNoteDetail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Product;
use Illuminate\Support\Facades\Mail;
use App\Mail\SupplierNoteConfirmed;


class SupplierNoteController extends Controller
{
    //

public function index(Request $request)
{
    $notes = SupplierNote::with(['supplier', 'details.product', 'createdBy', 'confirmedBy'])
        ->when($request->status, function ($query, $status) {
            $query->where('status', $status);
        })
        ->orderBy('created_at', 'desc')
        ->get();

    return response()->json([
        'data' => $notes
    ], 200);
}


public function store(Request $request)
{
    $employee = auth()->user()->employee;
    if (!$employee) {
        return response()->json(['message' => 'Empleado no encontrado'], 404);
    }

    $validated = $request->validate([
        'supplier_id' => 'required|exists:suppliers,id',
        'total_amount' => 'required|numeric|min:0',
        'delivery_date' => 'required|date',
        'reminders' => 'nullable|string',
        'products' => 'required|array|min:1',
        'products.*.product_id' => 'required|exists:products,id',
        'products.*.quantity_agreed' => 'required|integer|min:1',
        'products.*.price_agreed' => 'required|numeric|min:0',
        'products.*.discount' => 'nullable|numeric|min:0',
        'products.*.is_gift' => 'nullable|boolean',
    ]);

    DB::beginTransaction();
    try {
        $note = SupplierNote::create([
            'supplier_id' => $validated['supplier_id'],
            'total_amount' => $validated['total_amount'],
            'delivery_date' => $validated['delivery_date'],
            'reminders' => $validated['reminders'] ?? null,
            'status' => 'pending',
            'created_by' => $employee->id,
        ]);

        foreach ($validated['products'] as $product) {
            SupplierNoteDetail::create([
                'supplier_note_id' => $note->id,
                'product_id' => $product['product_id'],
                'quantity_agreed' => $product['quantity_agreed'],
                'price_agreed' => $product['price_agreed'],
                'discount' => $product['discount'] ?? 0,
                'is_gift' => $product['is_gift'] ?? false,
            ]);
        }

        DB::commit();

        // Fuera de la transacción, con su propio try-catch dentro del método:
        // un fallo de correo nunca debe afectar la respuesta ni revertir
        // la nota, que ya se guardó correctamente.
        $this->notificarAlmacenista($note->fresh(['supplier', 'details.product']), $employee);

        return response()->json([
            'message' => 'Nota de proveedor creada exitosamente',
            'data' => $note->fresh(['supplier', 'details.product']),
        ], 201);
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    public function show($id)
    {
        $note = SupplierNote::with(['supplier', 'details.product', 'createdBy', 'confirmedBy'])->findOrFail($id);
        return response()->json([
            'data' => $note
        ], 200);
    }
    public function update(Request $request, $id)
    {
        $note = SupplierNote::findOrFail($id);

        // Solo se puede editar el contenido de una nota mientras sigue pendiente.
        // Una vez confirmada o pagada, su historial no debe alterarse por aquí.
        if ($note->status !== 'pending') {
            return response()->json([
                'message' => 'Solo se pueden editar notas en estado pendiente. Usa /confirm o /pay para avanzar el estado.'
            ], 400);
        }

        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'total_amount' => 'required|numeric|min:0',
            'delivery_date' => 'required|date',
            'reminders' => 'nullable|string',
        ]);

        $note->update($validated);

        return response()->json([
            'message' => 'Nota de proveedor actualizada exitosamente',
            'data' => $note
        ], 200);
    }
    public function destroy($id)
    {
        $note = SupplierNote::findOrFail($id);
        $note->delete();

        return response()->json([
            'message' => 'Nota de proveedor eliminada exitosamente'
        ], 200);
    }

    public function confirm(Request $request, $id)
    {
        $employee = auth()->user()->employee;
        if (!$employee) {
            return response()->json(['message' => 'Empleado no encontrado'], 404);
        }

        $note = SupplierNote::with(['details.product', 'supplier'])->findOrFail($id);

        if ($note->status !== 'pending') {
            return response()->json(['message' => 'Solo se pueden confirmar notas pendientes'], 400);
        }

        $validated = $request->validate([
            'products' => 'required|array|min:1',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.quantity_received' => 'required|integer|min:0',
            'observations' => 'nullable|string|max:1000',
        ]);

        // Rechazar product_id repetidos: si vinieran duplicados, el increment
        // de stock correría dos veces sobre el mismo producto (bug silencioso).
        $ids = array_column($validated['products'], 'product_id');
        if (count($ids) !== count(array_unique($ids))) {
            return response()->json([
                'message' => 'Hay productos repetidos. Agrupa las cantidades en una sola línea por producto.'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $diferencias = [];

            foreach ($validated['products'] as $item) {
                $detail = $note->details->firstWhere('product_id', $item['product_id']);

                if (!$detail) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "El producto ID {$item['product_id']} no pertenece a esta nota de trato"
                    ], 422);
                }

                $detail->update(['quantity_received' => $item['quantity_received']]);
                Product::where('id', $item['product_id'])->increment('stock', $item['quantity_received']);

                $diferencias[] = [
                    'producto' => $detail->product->name ?? "ID {$item['product_id']}",
                    'pactado' => $detail->quantity_agreed,
                    'recibido' => $item['quantity_received'],
                    'diferencia' => $item['quantity_received'] - $detail->quantity_agreed,
                ];
            }

            $note->update([
                'status' => 'confirmed',
                'confirmed_by' => $employee->id,
                'confirmed_at' => now(),
                'observations' => $validated['observations'] ?? null,
            ]);

            DB::commit();


            $this->notificarAlDueno($note, $diferencias, $validated['observations'] ?? null, $employee);

            return response()->json([
                'message' => 'Nota confirmada y stock actualizado',
                'diferencias' => $diferencias,
                'data' => $note->fresh(['details.product', 'supplier']),
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    private function notificarAlDueno($note, array $diferencias, ?string $observaciones, $employee): void
    {
        try {
            $admins = \App\Models\User::whereHas('role', function ($q) {
                $q->where('name', 'Administrador');
            })->get();

            foreach ($admins as $admin) {
                \Illuminate\Support\Facades\Mail::to($admin->email)->send(
                    new \App\Mail\SupplierNoteConfirmed($note, $diferencias, $observaciones, $employee)
                );
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error al notificar confirmación de nota', [
                'note_id' => $note->id,
                'error' => $e->getMessage(),
            ]);
        }
    }


    
private function scanConClaude(string $imageData, string $mimeType): ?string
{
    $apiKey = config('services.anthropic.key');
    $response = Http::withHeaders([
        'x-api-key' => $apiKey,
        'anthropic-version' => '2023-06-01',
    ])->post("https://api.anthropic.com/v1/messages", [
        'model' => 'claude-sonnet-4-6',
        'max_tokens' => 1024,
        'messages' => [
            [
                'role' => 'user',
                'content' => [
                    [
                        'type' => 'image',
                        'source' => [
                            'type' => 'base64',
                            'media_type' => $mimeType,
                            'data' => $imageData,
                        ]
                    ],
                    [
                        'type' => 'text',
                        'text' => 'Analiza este ticket de proveedor y extrae todos los productos. '
                            . 'Para cada producto busca si tiene un código o clave impresa junto al nombre '
                            . '(usualmente un número de varios dígitos que aparece antes o junto a la descripción '
                            . 'del producto, distinto del precio). Devuelve SOLO un array JSON con los campos: '
                            . 'nombre, codigo (o null si no detectas ninguno), cantidad, precio_unitario. '
                            . 'Sin texto adicional, sin markdown, solo el JSON.'
                    ]
                ]
            ]
        ]
    ]);

    Log::info('Respuesta Claude:', ['status' => $response->status(), 'body' => $response->json()]);

    return $response->json('content.0.text');
}

private function scanConGroq(string $imageData, string $mimeType): ?string
{
    $apiKey = config('services.groq.key');

    $response = Http::withHeaders([
        'Authorization' => 'Bearer ' . $apiKey,
        'Content-Type' => 'application/json',
    ])->post('https://api.groq.com/openai/v1/chat/completions', [
        'model' => 'qwen/qwen3.8-27b',
        'messages' => [
            [
                'role' => 'user',
                'content' => [
                    [
                        'type' => 'text',
                        'text' => 'Analiza este ticket de proveedor y extrae todos los productos. '
                            . 'Para cada producto busca si tiene un código o clave impresa junto al nombre. '
                            . 'Devuelve SOLO un array JSON con los campos: nombre, codigo (o null), '
                            . 'cantidad, precio_unitario. Sin texto adicional, sin markdown, solo el JSON.',
                    ],
                    [
                        'type' => 'image_url',
                        'image_url' => [
                            'url' => "data:{$mimeType};base64,{$imageData}",
                        ],
                    ],
                ],
            ],
        ],
        'temperature' => 0.3,
        'max_completion_tokens' => 2048,
    ]);

    Log::info('Respuesta Groq:', ['status' => $response->status(), 'body' => $response->json()]);

    return $response->json('choices.0.message.content');
}

private function limpiarJson(?string $text): string
{
    $clean = preg_replace('/```json\s*/i', '', $text ?? '');
    $clean = preg_replace('/```\s*/i', '', $clean);
    return trim($clean);
}

public function scan(Request $request)
{
    $request->validate([
        'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:10240',
    ]);

    try {
        $image = $request->file('image');
        $imageData = base64_encode(file_get_contents($image->getRealPath()));
        $mimeType = $image->getMimeType();

        // Intento 1: Claude
        $text = $this->scanConClaude($imageData, $mimeType);
        $clean = $this->limpiarJson($text);
        $products = json_decode($clean, true);
        $proveedor = 'Claude';

        // Intento 2: si Claude falló o devolvió JSON inválido, usar Groq
        if (empty($text) || json_last_error() !== JSON_ERROR_NONE) {
            Log::warning('Claude falló o devolvió JSON inválido, usando Groq como respaldo', [
                'texto_claude' => $text,
                'error_json' => json_last_error_msg(),
            ]);

            $text = $this->scanConGroq($imageData, $mimeType);
            $clean = $this->limpiarJson($text);
            $products = json_decode($clean, true);
            $proveedor = 'Groq';
        }

        // Si ninguno de los dos dio JSON válido, error claro en vez de datos basura
        if (json_last_error() !== JSON_ERROR_NONE) {
            Log::error('Ni Claude ni Groq devolvieron JSON válido', [
                'texto_final' => $text,
            ]);

            return response()->json([
                'message' => 'No se pudo procesar el ticket. Intenta con una foto más clara.',
            ], 422);
        }

        Log::info("Ticket procesado exitosamente con {$proveedor}");

        return response()->json([
            'message' => 'Productos extraídos del ticket',
            'products' => $products
        ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Error al procesar la imagen: ' . $e->getMessage()
        ], 500);
    }
}



    public function historial()
    {
        $notes = SupplierNote::with(['supplier', 'details.product', 'confirmedBy'])
            ->whereIn('status', ['confirmed', 'paid'])
            ->orderBy('confirmed_at', 'desc')
            ->get();

        return response()->json(['data' => $notes], 200);
    }
    public function pay($id)
    {
        $note = SupplierNote::findOrFail($id);

        if ($note->status !== 'confirmed') {
            return response()->json(['message' => 'Solo se pueden pagar notas confirmadas'], 400);
        }

        $note->update(['status' => 'paid']);

        return response()->json(['message' => 'Nota marcada como pagada', 'data' => $note], 200);
    }


private function notificarAlmacenista($note, $employee): void
{
    try {
        $almacenistas = \App\Models\User::whereHas('role', function ($q) {
            $q->where('name', 'Almacenista');
        })->get();

        foreach ($almacenistas as $u) {
            \Illuminate\Support\Facades\Mail::to($u->email)->send(
                new \App\Mail\SupplierNoteCreated($note, $employee)
            );
        }
    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\Log::error('Error al notificar nota nueva al almacenista', [
            'note_id' => $note->id,
            'error' => $e->getMessage(),
        ]);
    }
}
}
