<?php

namespace Database\Factories;

use App\Models\CashRegister;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CashRegister>
 */
class CashRegisterFactory extends Factory
{
    protected $model = CashRegister::class;

    public function definition(): array
    {
        $openingCash = fake()->randomFloat(2, 200, 1000);

        return [
            'employee_id' => Employee::factory(),
            'opening_cash' => $openingCash,
            'expected_cash' => null,
            'actual_cash' => null,
            'opened_at' => now()->subHours(fake()->numberBetween(1, 8)),
            'closed_at' => null,
        ];
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'expected_cash' => fake()->randomFloat(2, $attributes['opening_cash'], $attributes['opening_cash'] + 5000),
            'actual_cash' => fake()->randomFloat(2, $attributes['opening_cash'] - 50, $attributes['opening_cash'] + 5000),
            'closed_at' => now(),
        ]);
    }

    public function open(): static
    {
        return $this->state(fn () => [
            'expected_cash' => null,
            'actual_cash' => null,
            'closed_at' => null,
        ]);
    }
}
