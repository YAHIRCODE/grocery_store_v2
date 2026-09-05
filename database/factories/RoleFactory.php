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
        return [
            'name' => 'Rol ' . fake()->unique()->numberBetween(1000, 9999),
            'description' => fake()->sentence(),
        ];
    }

    public function admin(): static
    {
        return $this->state(fn () => [
            'name' => 'Administrador',
        ]);
    }

    public function cashier(): static
    {
        return $this->state(fn () => [
            'name' => 'Cajero',
        ]);
    }
}
