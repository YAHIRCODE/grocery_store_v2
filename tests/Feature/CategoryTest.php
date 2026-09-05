<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->loginAsAdmin();
    }

    public function test_index_returns_categories(): void
    {
        $this->createCategory();

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/categories');

        $response->assertStatus(200)
->assertJsonStructure([
    'data' => ['*' => ['id', 'name', 'description']],
]);
    }

    public function test_store_category(): void
    {
        $payload = [
            'name' => 'Frutas y Verduras',
            'description' => 'Categoría de frutas frescas',
        ];

        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/categories', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'data']);

        $this->assertDatabaseHas('categories', ['name' => 'Frutas y Verduras']);
    }

    public function test_store_category_validation(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/categories', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_show_category(): void
    {
        $category = $this->createCategory();

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/categories/{$category->id}");

        $response->assertStatus(200)
->assertJsonStructure(['data' => ['id', 'name', 'description']]);
    }

    public function test_update_category(): void
    {
        $category = $this->createCategory();

        $payload = [
            'name' => 'Bebidas Actualizadas',
            'description' => 'Descripción actualizada',
        ];

        $response = $this->withHeaders($this->authHeaders())
            ->putJson("/api/categories/{$category->id}", $payload);

        $response->assertStatus(200);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Bebidas Actualizadas',
        ]);
    }

    public function test_destroy_category(): void
    {
        $category = $this->createCategory();

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_destroy_category_with_products(): void
    {
        $category = $this->createCategory();
        $this->createProduct(['category_id' => $category->id]);

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(409);

        $this->assertDatabaseHas('categories', ['id' => $category->id]);
    }
}
