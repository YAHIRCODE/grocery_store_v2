<?php

namespace Database\Factories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Client>
 */
class ClientFactory extends Factory
{
    protected $model = Client::class;

    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'phone' => '33' . fake()->numerify('#######'),
            'email' => fake()->optional(0.6)->safeEmail(),
            'credit_limit' => fake()->randomFloat(2, 500, 10000),
        ];
    }

    public function withoutCredit(): static
    {
        return $this->state(fn () => [
            'credit_limit' => 0,
        ]);
    }
}
