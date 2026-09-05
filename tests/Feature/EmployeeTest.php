<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Employee;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->loginAsAdmin();
    }

    public function test_index_returns_employees(): void
    {
        Employee::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
            ->getJson('/api/employees');

        $response->assertStatus(200)
            ->assertJsonStructure([
                '*' => ['id', 'first_name', 'last_name', 'email', 'user'],
            ]);
    }

    public function test_store_employee(): void
    {
$role = \App\Models\Role::where('name', 'Cajero')->first();

        $payload = [
            'first_name' => 'María',
            'last_name' => 'García López',
            'email' => 'maria.garcia@test.com',
            'payroll_id' => 'PAY-00001',
            'hourly_rate' => 120.50,
            'phone' => '5551234567',
            'full_address' => 'Calle Principal 123',
            'card_number' => 'CARD-00001',
            'role_id' => $role->id,
        ];

        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/employees', $payload);

        $response->assertStatus(201);

        $this->assertDatabaseHas('users', ['email' => 'maria.garcia@test.com']);
        $this->assertDatabaseHas('employees', [
            'first_name' => 'María',
            'last_name' => 'García López',
            'email' => 'maria.garcia@test.com',
        ]);
    }

    public function test_store_employee_validation(): void
    {
        $response = $this->withHeaders($this->authHeaders())
            ->postJson('/api/employees', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['first_name', 'last_name', 'email', 'payroll_id', 'hourly_rate']);
    }

    public function test_show_employee(): void
    {
        $employee = Employee::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
            ->getJson("/api/employees/{$employee->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['id', 'first_name', 'last_name', 'email', 'user']);
    }

    public function test_update_employee(): void
    {
        $employee = Employee::factory()->create();
        $role = \App\Models\Role::where('name', 'Cajero')->first();

        $payload = [
            'first_name' => 'Carlos',
            'last_name' => 'Mendoza Ruiz',
            'email' => $employee->email,
            'payroll_id' => $employee->payroll_id,
            'hourly_rate' => 135.00,
            'phone' => '5559876543',
            'full_address' => 'Av. Reforma 456',
            'card_number' => 'CARD-00002',
            'role_id' => $role->id,
        ];

        $response = $this->withHeaders($this->authHeaders())
            ->putJson("/api/employees/{$employee->id}", $payload);

        $response->assertStatus(200);

        $this->assertDatabaseHas('employees', [
            'id' => $employee->id,
            'first_name' => 'Carlos',
            'last_name' => 'Mendoza Ruiz',
        ]);
    }

    public function test_destroy_employee(): void
    {
        $employee = Employee::factory()->create();

        $response = $this->withHeaders($this->authHeaders())
            ->deleteJson("/api/employees/{$employee->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('employees', ['id' => $employee->id, 'deleted_at' => null]);
    }
}
