<?php

namespace Database\Factories;

use App\Models\Client;
use App\Models\ClientDebt;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ClientDebt>
 */
class ClientDebtFactory extends Factory
{
    protected $model = ClientDebt::class;

    public function definition(): array
    {
        $balanceDue = fake()->randomFloat(2, 100, 5000);

        return [
            'client_id' => Client::factory(),
            'sale_group_id' => fake()->optional(0.7)->passthrough(fn () => Str::uuid()->toString()),
            'start_date' => fake()->dateTimeBetween('-60 days', '-1 days'),
            'due_date' => fake()->dateTimeBetween('+1 days', '+60 days'),
            'balance_due' => $balanceDue,
            'status' => 'pending',
        ];
    }

    public function paid(): static
    {
        return $this->state(fn () => [
            'status' => 'paid',
            'balance_due' => 0,
        ]);
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => 'pending',
        ]);
    }

    public function overdue(): static
    {
        return $this->state(fn () => [
            'status' => 'pending',
            'due_date' => fake()->dateTimeBetween('-30 days', '-1 days'),
        ]);
    }
}
