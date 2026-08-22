<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Role>
 */
class RoleFactory extends Factory
{
    protected $model = Role::class;

    public function definition(): array
    {
        $roles = [
            ['name' => 'Administrador', 'slug' => 'admin', 'description' => 'Acceso total al sistema'],
            ['name' => 'Cajero', 'slug' => 'cashier', 'description' => 'Operador de caja'],
            ['name' => 'Gerente', 'slug' => 'manager', 'description' => 'Gestion de sucursal'],
            ['name' => 'Almacen', 'slug' => 'warehouse', 'description' => 'Control de inventario'],
        ];

        $role = fake()->randomElement($roles);

        return [
            'name' => $role['name'],
            'slug' => $role['slug'],
            'description' => $role['description'],
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => [
            'name' => 'Administrador',
            'slug' => 'admin',
        ]);
    }

    public function cashier(): static
    {
        return $this->state(fn () => [
            'name' => 'Cajero',
            'slug' => 'cashier',
        ]);
    }
}
