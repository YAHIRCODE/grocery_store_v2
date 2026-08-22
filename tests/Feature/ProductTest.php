<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Sale;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->loginAsAdmin();
    }

    public function test_index_returns_products(): void
    {
        $this->createProduct();

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                '*' => ['id', 'name', 'category_id'],
            ]);
    }

    public function test_store_product(): void
    {
        $category = $this->createCategory();

        $payload = [
            'category_id' => $category->id,
            'name' => 'Tortillas de Harina 1kg',
            'barcode' => '7501099999001',
            'description' => 'Tortillas de harina artesanales',
            'stock' => 50,
            'min_stock' => 10,
            'purchase_price' => 18.50,
            'price' => 25.00,
        ];

        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/products', $payload);

        $response->assertStatus(201);

        $this->assertDatabaseHas('products', [
            'name' => 'Tortillas de Harina 1kg',
            'category_id' => $category->id,
        ]);
    }

    public function test_store_product_validation(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/products', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'category_id']);
    }

    public function test_show_product(): void
    {
        $product = $this->createProduct();

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['id', 'name', 'category_id']);
    }

    public function test_update_product(): void
    {
        $product = $this->createProduct();
        $category = $this->createCategory();

        $payload = [
            'category_id' => $category->id,
            'name' => 'Coca-Cola 2L Actualizado',
            'barcode' => '7501020528099',
            'description' => 'Refresco de cola 2 litros',
            'stock' => 100,
            'min_stock' => 20,
            'purchase_price' => 22.00,
            'price' => 32.50,
        ];

        $response = $this->withHeaders($this->authHeaders())
            ->putJson("/api/products/{$product->id}", $payload);

        $response->assertStatus(200);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Coca-Cola 2L Actualizado',
        ]);
    }

    public function test_destroy_product_with_sales(): void
    {
        $product = $this->createProduct();
        $cashRegister = $this->createCashRegister();

        Sale::factory()->create([
            'product_id' => $product->id,
            'cash_register_id' => $cashRegister->id,
            'employee_id' => $this->adminUser->employee->id,
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/products/{$product->id}");

        $response->assertStatus(400);

        $this->assertDatabaseHas('products', ['id' => $product->id, 'deleted_at' => null]);
    }

    public function test_trashed_products(): void
    {
        $product = $this->createProduct();
        $product->delete();

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/products/trashed');

        $response->assertStatus(200)
            ->assertJsonStructure([
                '*' => ['id', 'name', 'deleted_at'],
            ]);
    }

    public function test_match_products_by_name(): void
    {
        $product = $this->createProduct(['name' => 'Aceite Capullo 1L']);

        $payload = [
            'products' => [
                ['nombre' => 'Aceite Capullo 1L', 'cantidad' => 10, 'precio_unitario' => 45.00],
            ],
        ];

        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/products/match', $payload);

        $response->assertStatus(200)
            ->assertJsonStructure(['matched', 'unmatched'])
            ->assertJsonCount(1, 'matched');
    }
}
