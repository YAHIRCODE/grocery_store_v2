<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\Supplier;
use App\Models\SupplierNote;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SupplierNote>
 */
class SupplierNoteFactory extends Factory
{
    protected $model = SupplierNote::class;

    public function definition(): array
    {
        return [
            'supplier_id' => Supplier::factory(),
            'total_amount' => fake()->randomFloat(2, 500, 25000),
            'status' => 'pending',
            'observations' => fake()->optional(0.6)->sentence(),
            'delivery_date' => fake()->dateTimeBetween('+1 days', '+30 days'),
            'reminders' => fake()->optional(0.3)->numberBetween(1, 3),
            'created_by' => Employee::factory(),
            'confirmed_by' => null,
            'confirmed_at' => null,
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn () => [
            'status' => 'confirmed',
            'confirmed_by' => Employee::factory(),
            'confirmed_at' => now(),
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => 'pending',
            'confirmed_by' => null,
            'confirmed_at' => null,
        ]);
    }

    public function delivered(): static
    {
        return $this->state(fn () => [
            'status' => 'delivered',
            'confirmed_by' => Employee::factory(),
            'confirmed_at' => now(),
        ]);
    }
}
