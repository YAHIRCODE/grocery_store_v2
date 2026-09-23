<?php

namespace Tests\Feature;

use App\Models\SupplierNote;
use App\Models\SupplierNoteDetail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class SupplierNoteTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Evita que store()/confirm() intenten mandar correos reales
        // vía Mailtrap durante los tests (y su límite de envíos/segundo).
        Mail::fake();
    }

    public function test_destroy_blocks_note_not_pending(): void
    {
        $this->loginAsAdmin();
        $supplier = $this->createSupplier();
        $product = $this->createProduct(['supplier_id' => $supplier->id]);

        $note = SupplierNote::create([
            'supplier_id' => $supplier->id,
            'total_amount' => 100,
            'status' => 'confirmed',
            'delivery_date' => now(),
            'created_by' => $this->adminUser->employee->id,
            'confirmed_by' => $this->adminUser->employee->id,
            'confirmed_at' => now(),
        ]);

        SupplierNoteDetail::create([
            'supplier_note_id' => $note->id,
            'product_id' => $product->id,
            'quantity_agreed' => 5,
            'quantity_received' => 5,
            'price_agreed' => 20,
            'discount' => 0,
            'is_gift' => false,
        ]);

        $response = $this->deleteJson("/api/supplier-notes/{$note->id}");

        $response->assertStatus(400);
        $this->assertDatabaseHas('supplier_notes', ['id' => $note->id]);
    }

    public function test_destroy_allows_pending_note(): void
    {
        $this->loginAsAdmin();
        $supplier = $this->createSupplier();
        $product = $this->createProduct(['supplier_id' => $supplier->id]);

        $note = SupplierNote::create([
            'supplier_id' => $supplier->id,
            'total_amount' => 100,
            'status' => 'pending',
            'delivery_date' => now(),
            'created_by' => $this->adminUser->employee->id,
        ]);

        SupplierNoteDetail::create([
            'supplier_note_id' => $note->id,
            'product_id' => $product->id,
            'quantity_agreed' => 5,
            'quantity_received' => 0,
            'price_agreed' => 20,
            'discount' => 0,
            'is_gift' => false,
        ]);

        $response = $this->deleteJson("/api/supplier-notes/{$note->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('supplier_notes', ['id' => $note->id]);
    }

    public function test_total_amount_is_calculated_server_side(): void
    {
        $this->loginAsAdmin();
        $supplier = $this->createSupplier();
        $productA = $this->createProduct(['supplier_id' => $supplier->id]);
        $productB = $this->createProduct(['supplier_id' => $supplier->id]);

        $payload = [
            'supplier_id' => $supplier->id,
            'total_amount' => 999999, // deliberadamente incorrecto
            'delivery_date' => now()->toDateString(),
            'products' => [
                [
                    'product_id' => $productA->id,
                    'quantity_agreed' => 5,
                    'price_agreed' => 10,
                    'discount' => 0,
                ],
                [
                    'product_id' => $productB->id,
                    'quantity_agreed' => 3,
                    'price_agreed' => 20,
                    'discount' => 5,
                ],
            ],
        ];

        $response = $this->postJson('/api/supplier-notes', $payload);

        $response->assertStatus(201);

        // 5*10 + (3*20 - 5) = 50 + 55 = 105, NO 999999
        $this->assertDatabaseHas('supplier_notes', [
            'supplier_id' => $supplier->id,
            'total_amount' => 105.00,
        ]);
    }

    public function test_pay_sets_paid_by_and_paid_at(): void
    {
        $this->loginAsAdmin();
        $supplier = $this->createSupplier();
        $product = $this->createProduct(['supplier_id' => $supplier->id]);

        $note = SupplierNote::create([
            'supplier_id' => $supplier->id,
            'total_amount' => 50,
            'status' => 'pending',
            'delivery_date' => now(),
            'created_by' => $this->adminUser->employee->id,
        ]);

        SupplierNoteDetail::create([
            'supplier_note_id' => $note->id,
            'product_id' => $product->id,
            'quantity_agreed' => 5,
            'quantity_received' => 0,
            'price_agreed' => 10,
            'discount' => 0,
            'is_gift' => false,
        ]);

        $confirmResponse = $this->putJson("/api/supplier-notes/{$note->id}/confirm", [
            'products' => [
                ['product_id' => $product->id, 'quantity_received' => 5],
            ],
        ]);
        $confirmResponse->assertStatus(200);

        $payResponse = $this->putJson("/api/supplier-notes/{$note->id}/pay");
        $payResponse->assertStatus(200);

        $this->assertDatabaseHas('supplier_notes', [
            'id' => $note->id,
            'status' => 'paid',
            'paid_by' => $this->adminUser->employee->id,
        ]);

        $note->refresh();
        $this->assertNotNull($note->paid_at);
    }
}
