<?php

namespace Database\Factories;

use App\Models\CashRegister;
use App\Models\Client;
use App\Models\Employee;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Sale>
 */
class SaleFactory extends Factory
{
    protected $model = Sale::class;

    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 10);
        $unitPrice = fake()->randomFloat(2, 5, 250);
        $totalPrice = round($quantity * $unitPrice, 2);

        $paymentMethod = fake()->randomElement(['cash', 'card', 'mixed']);
        $cashAmount = $paymentMethod === 'card' ? 0 : $totalPrice;
        $cardAmount = $paymentMethod === 'cash' ? 0 : ($paymentMethod === 'mixed' ? fake()->randomFloat(2, 10, $totalPrice) : $totalPrice);

        return [
            'sale_group_id' => Str::uuid()->toString(),
            'product_id' => Product::factory(),
            'cash_register_id' => CashRegister::factory(),
            'employee_id' => Employee::factory(),
            'client_id' => fake()->optional(0.3)->passthrough(fn () => Client::factory()->create()->id),
            'quantity' => $quantity,
            'unit_type' => fake()->randomElement(['pieza', 'kg', 'litro', 'caja']),
            'unit_price' => $unitPrice,
            'total_price' => $totalPrice,
            'cash_amount' => $cashAmount,
            'card_amount' => $cardAmount,
            'payment_method' => $paymentMethod,
            'status' => 'completed',
            'change_amount' => $paymentMethod === 'cash' ? fake()->randomFloat(2, 0, 50) : 0,
        ];
    }

    public function cash(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_method' => 'cash',
            'cash_amount' => $attributes['total_price'],
            'card_amount' => 0,
        ]);
    }

    public function card(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_method' => 'card',
            'cash_amount' => 0,
            'card_amount' => $attributes['total_price'],
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => [
            'status' => 'cancelled',
        ]);
    }
}
