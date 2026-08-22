<?php

namespace Database\Factories;

use App\Models\InventoryAdjustment;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryAdjustment>
 */
class InventoryAdjustmentFactory extends Factory
{
    protected $model = InventoryAdjustment::class;

    public function definition(): array
    {
        $reasons = [
            'Producto danado',
            'Merma por caducidad',
            'Conteo fisico - ajuste',
            'Robo o extravio',
            'Devolucion de cliente',
            'Error de captura',
            'Producto encontrado en inventario',
        ];

        return [
            'product_id' => Product::factory(),
            'adjustment_type' => fake()->randomElement(['addition', 'subtraction']),
            'quantity' => fake()->numberBetween(1, 50),
            'reason' => fake()->randomElement($reasons),
        ];
    }

    public function addition(): static
    {
        return $this->state(fn () => [
            'adjustment_type' => 'addition',
        ]);
    }

    public function subtraction(): static
    {
        return $this->state(fn () => [
            'adjustment_type' => 'subtraction',
        ]);
    }
}
