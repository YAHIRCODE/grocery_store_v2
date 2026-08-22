<?php

namespace Database\Factories;

use App\Models\Supplier;
use App\Models\SupplierDebt;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SupplierDebt>
 */
class SupplierDebtFactory extends Factory
{
    protected $model = SupplierDebt::class;

    public function definition(): array
    {
        return [
            'supplier_id' => Supplier::factory(),
            'amount' => fake()->randomFloat(2, 500, 50000),
            'status' => 'pending',
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => [
            'status' => 'paid',
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => 'pending',
        ]);
    }
}
