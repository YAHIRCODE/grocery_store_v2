<?php

namespace Tests;

use App\Models\Role;
use App\Models\User;
use App\Models\Employee;
use App\Models\Category;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Client;
use App\Models\CashRegister;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Hash;

abstract class TestCase extends BaseTestCase
{
    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRoles();
    }

    protected function seedRoles(): void
    {
        Role::firstOrCreate(['name' => 'Administrador']);
        Role::firstOrCreate(['name' => 'Cajero']);
        Role::firstOrCreate(['name' => 'Almacenista']);
    }

    protected function createAdmin(): User
    {
        $role = Role::where('name', 'Administrador')->first();

        $user = User::factory()->create([
            'role_id' => $role->id,
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
        ]);

        Employee::factory()->create([
            'user_id' => $user->id,
            'first_name' => 'Admin',
            'last_name' => 'Test',
            'email' => 'admin@test.com',
        ]);

        return $user;
    }

    /**
     * Autentica al usuario admin vía sesión (no token Bearer), igual
     * que el flujo real de cookies HttpOnly usado en producción.
     */
    protected function loginAsAdmin(): User
    {
        $this->adminUser = $this->createAdmin();
        $this->actingAs($this->adminUser);

        return $this->adminUser;
    }

    /**
     * Ya no se usan headers de Authorization: la sesión autenticada
     * por actingAs() es suficiente en cada request de test.
     */
    protected function authHeaders(): array
    {
        if (!isset($this->adminUser)) {
            $this->loginAsAdmin();
        }

        return [];
    }

    protected function createCategory(array $overrides = []): Category
    {
        return Category::factory()->create($overrides);
    }

    protected function createSupplier(array $overrides = []): Supplier
    {
        return Supplier::factory()->create($overrides);
    }

    protected function createProduct(array $overrides = []): Product
    {
        $defaults = ['category_id' => fn () => $this->createCategory()->id];
        return Product::factory()->create(array_merge($defaults, $overrides));
    }

    protected function createClient(array $overrides = []): Client
    {
        return Client::factory()->create($overrides);
    }

    protected function createCashRegister(?User $user = null, array $overrides = []): CashRegister
    {
        $employee = $user?->employee ?? $this->adminUser?->employee;
        if (!$employee) {
            $admin = $this->adminUser ?? $this->createAdmin();
            $employee = $admin->employee;
        }
        return CashRegister::factory()->create(array_merge([
            'employee_id' => $employee->id,
            'closed_at' => null,
        ], $overrides));
    }
}