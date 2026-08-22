<?php

namespace Tests\Feature;

use App\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->loginAsAdmin();
    }

    public function test_index_returns_roles(): void
    {
        $response = $this->getJson('/api/roles', $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonStructure([
                '*' => ['id', 'name'],
            ]);
    }

    public function test_store_role_success(): void
    {
        $response = $this->postJson('/api/roles', [
            'name' => 'New Role',
            'slug' => 'new-role',
            'description' => 'A new test role',
        ], $this->authHeaders());

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'role' => ['id', 'name']]);

        $this->assertDatabaseHas('roles', ['name' => 'New Role']);
    }

    public function test_store_role_validation(): void
    {
        $response = $this->postJson('/api/roles', [], $this->authHeaders());

        $response->assertStatus(422);
    }

    public function test_update_role(): void
    {
        $role = Role::factory()->create();

        $response = $this->putJson("/api/roles/{$role->id}", [
            'name' => 'Updated Role',
            'description' => 'Updated description',
        ], $this->authHeaders());

        $response->assertStatus(200);

        $this->assertDatabaseHas('roles', [
            'id' => $role->id,
            'name' => 'Updated Role',
        ]);
    }

    public function test_destroy_role(): void
    {
        $role = Role::factory()->create();

        $response = $this->deleteJson("/api/roles/{$role->id}", [], $this->authHeaders());

        $response->assertStatus(200);

        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }
}
