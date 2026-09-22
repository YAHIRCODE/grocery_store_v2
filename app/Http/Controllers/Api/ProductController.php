<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Category;
use App\Models\ProductSupplierCode;

class ProductController extends Controller
{
    //
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $products = Product::with(['category', 'saleUnits'])->orderBy('name', 'asc')->get();
        return response()->json($products);
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
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'price' => 'required|numeric|min:0.01',
            'purchase_price' => 'required|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'category_id' => 'required|exists:categories,id',
            'barcode' => 'nullable|string|max:255',
            'min_stock' => 'nullable|integer|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'sale_units' => 'nullable|array',
            'sale_units.*.unit_type' => 'required_with:sale_units|in:package,weight',
            'sale_units.*.package_size' => 'nullable|integer|min:1',
            'sale_units.*.unit_price' => 'required_with:sale_units|numeric|min:0',
        ]);

        $validated['stock'] = $validated['stock'] ?? 0;
        $saleUnits = $validated['sale_units'] ?? [];
        unset($validated['sale_units']);

        $product = Product::create($validated);

        foreach ($saleUnits as $unit) {
            $product->saleUnits()->create($unit);
        }

return response()->json($product->load('saleUnits'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $product = Product::with(['category', 'saleUnits'])->findOrFail($id);
        return response()->json($product);
    }

    /**
     * Show the form for editing the specified resource.
     */

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'price' => 'required|numeric|min:0.01',
            'purchase_price' => 'required|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
            'category_id' => 'required|exists:categories,id',
            'barcode' => 'nullable|string|max:255',
            'min_stock' => 'nullable|integer|min:0',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'sale_units' => 'nullable|array',
            'sale_units.*.id' => 'nullable|exists:product_sale_units,id',
            'sale_units.*.unit_type' => 'required_with:sale_units|in:package,weight',
            'sale_units.*.package_size' => 'nullable|integer|min:1',
            'sale_units.*.unit_price' => 'required_with:sale_units|numeric|min:0',
        ]);

        $saleUnits = $validated['sale_units'] ?? null;
        unset($validated['sale_units']);

        $product->update($validated);

        if ($saleUnits !== null) {
            $product->saleUnits()->delete();
            foreach ($saleUnits as $unit) {
                $product->saleUnits()->create($unit);
            }
        }

        return response()->json(['message' => 'Producto actualizado exitosamente', 'data' => $product->load('saleUnits')]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $product = Product::findOrFail($id);

            // Verificar si tiene ventas
            $ventasCount = $product->sales()->count();

            if ($ventasCount > 0) {
                return response()->json(['message' => "No se puede eliminar: tiene {$ventasCount} ventas."], 400);
            }

            $product->delete();
            return response()->json(['message' => 'Producto eliminado correctamente']);
        } catch (\Exception $e) {

            return response()->json(['message' => 'Error al eliminar: ' . $e->getMessage()], 500);
        }
    }


    public function trashed()
    {
        $products = Product::onlyTrashed()
            ->with('category')
            ->orderBy('deleted_at', 'desc')
            ->get();

        return response()->json($products);
    }
    // este es para restaurar un producto eliminado
    public function restore(string $id)
    {
        $product = Product::onlyTrashed()->findOrFail($id);
        $product->restore();

        return response()->json(['message' => 'Producto restaurado exitosamente']);
    }

    //este solo es borrar pernamente si es que el producto deja de existir 
    public function forceDelete(string $id)
    {
        // Solo administradores pueden eliminar permanentemente
        if (!auth()->check() || !auth()->user()->isAdmin()) {
            return response()->json([
                'message' => 'No tienes permisos para eliminar permanentemente productos'
            ], 403);
        }

        $product = Product::onlyTrashed()->findOrFail($id);

        // Verificar que no tenga ventas
        if ($product->sales()->count() > 0) {
            return response()->json(['message' => 'No se puede eliminar permanentemente porque tiene ventas registradas.'], 400);
        }

        // Eliminar PERMANENTEMENTE (se borra de la BD)
        $product->forceDelete();

        return response()->json(['message' => 'Producto eliminado permanentemente de la base de datos']);
    }



    public function match(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'nullable|exists:suppliers,id',
            'products' => 'required|array|min:1',
            'products.*.nombre' => 'required|string',
            'products.*.codigo' => 'nullable|string',
            'products.*.cantidad' => 'nullable|numeric',
            'products.*.precio_unitario' => 'nullable|numeric',
        ]);

        $matched = [];
        $unmatched = [];

        // Códigos de ESTE proveedor específico, indexados por código
        $supplierId = $validated['supplier_id'] ?? null;
        $codigosDelProveedor = $supplierId
            ? \App\Models\ProductSupplierCode::where('supplier_id', $supplierId)
                ->with('product')
                ->get()
                ->keyBy('code')
            : collect();

        $porNombre = Product::all()->keyBy(fn($p) => strtolower(trim($p->name)));

        foreach ($validated['products'] as $item) {
            $producto = null;
            $matchedBy = null;

            // 1. Código exacto, DENTRO del catálogo de códigos de este proveedor
            if (!empty($item['codigo']) && $codigosDelProveedor->has($item['codigo'])) {
                $producto = $codigosDelProveedor->get($item['codigo'])->product;
                $matchedBy = 'codigo';
            }

            // 2. Respaldo: nombre exacto en todo el catálogo
            if (!$producto) {
                $nombreLimpio = strtolower(trim($item['nombre']));
                if ($porNombre->has($nombreLimpio)) {
                    $producto = $porNombre->get($nombreLimpio);
                    $matchedBy = 'nombre';
                }
            }

            if ($producto) {
                $matched[] = [
                    'id' => $producto->id,
                    'name' => $producto->name,
                    'matched_by' => $matchedBy,
                    'cantidad' => $item['cantidad'] ?? null,
                    'precio_unitario' => $item['precio_unitario'] ?? null,
                ];
            } else {
                $unmatched[] = $item['nombre'];
            }
        }

        return response()->json(['matched' => $matched, 'unmatched' => $unmatched]);
    }

    public function storeSupplierCode(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'code' => 'required|string|max:50',
        ]);

        $entry = \App\Models\ProductSupplierCode::updateOrCreate(
            ['supplier_id' => $validated['supplier_id'], 'code' => $validated['code']],
            ['product_id' => $validated['product_id']]
        );

        return response()->json(['message' => 'Código registrado', 'data' => $entry], 201);
    }
}
