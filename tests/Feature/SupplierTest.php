<?php

namespace Tests\Feature;

use App\Models\SupplierNote;
use App\Models\SupplierDebt;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->loginAsAdmin();
    }

    public function test_index_returns_suppliers(): void
    {
        $this->createSupplier();

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/suppliers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                '*' => ['id', 'company_name', 'contact_name', 'phone', 'email'],
            ]);
    }

    public function test_store_supplier(): void
    {
        $payload = [
            'company_name' => 'Distribuidora ABC',
            'contact_name' => 'Juan Pérez',
            'phone' => '555-0100',
            'email' => 'contacto@abc.com',
        ];

        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/suppliers', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'data']);

        $this->assertDatabaseHas('suppliers', ['company_name' => 'Distribuidora ABC']);
    }

    public function test_store_supplier_validation(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/suppliers', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['company_name', 'contact_name', 'phone', 'email']);
    }

    public function test_show_supplier(): void
    {
        $supplier = $this->createSupplier();

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/suppliers/{$supplier->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'data']);
    }

    public function test_update_supplier(): void
    {
        $supplier = $this->createSupplier();

        $payload = [
            'company_name' => 'Distribuidora XYZ',
            'contact_name' => 'María López',
            'phone' => '555-0200',
            'email' => 'ventas@xyz.com',
        ];

        $response = $this->withHeaders($this->authHeaders())
            ->putJson("/api/suppliers/{$supplier->id}", $payload);

        $response->assertStatus(200);

        $this->assertDatabaseHas('suppliers', [
            'id' => $supplier->id,
            'company_name' => 'Distribuidora XYZ',
        ]);
    }

    public function test_destroy_supplier(): void
    {
        $supplier = $this->createSupplier();

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/suppliers/{$supplier->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('suppliers', ['id' => $supplier->id]);
    }

    public function test_destroy_supplier_with_notes(): void
    {
        $supplier = $this->createSupplier();

        SupplierNote::create([
            'supplier_id' => $supplier->id,
            'note' => 'Nota de prueba',
        ]);

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/suppliers/{$supplier->id}");

        $response->assertStatus(409);

        $this->assertDatabaseHas('suppliers', ['id' => $supplier->id]);
    }
}
