<?php

namespace Database\Factories;

use App\Models\ProviderFund;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProviderFund>
 */
class ProviderFundFactory extends Factory
{
    protected $model = ProviderFund::class;

    public function definition(): array
    {
        $definedAmount = fake()->randomFloat(2, 10000, 100000);

        return [
            'defined_amount' => $definedAmount,
            'extraction_limit' => fake()->randomFloat(2, $definedAmount * 0.3, $definedAmount * 0.8),
            'available_balance' => fake()->randomFloat(2, $definedAmount * 0.2, $definedAmount),
            'notes' => fake()->optional(0.5)->sentence(),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => [
            'is_active' => false,
        ]);
    }

    public function depleted(): static
    {
        return $this->state(fn () => [
            'available_balance' => 0,
        ]);
    }
}
