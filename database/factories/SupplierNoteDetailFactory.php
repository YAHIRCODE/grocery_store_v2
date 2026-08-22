<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\SupplierNote;
use App\Models\SupplierNoteDetail;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SupplierNoteDetail>
 */
class SupplierNoteDetailFactory extends Factory
{
    protected $model = SupplierNoteDetail::class;

    public function definition(): array
    {
        $quantityAgreed = fake()->numberBetween(10, 200);

        return [
            'supplier_note_id' => SupplierNote::factory(),
            'product_id' => Product::factory(),
            'quantity_agreed' => $quantityAgreed,
            'quantity_received' => fake()->optional(0.8)->numberBetween($quantityAgreed - 5, $quantityAgreed + 5) ?? $quantityAgreed,
            'price_agreed' => fake()->randomFloat(2, 5, 150),
            'discount' => fake()->optional(0.4)->randomFloat(2, 0, 30),
            'is_gift' => fake()->optional(0.1)->boolean(),
        ];
    }

    public function gift(): static
    {
        return $this->state(fn () => [
            'is_gift' => true,
            'price_agreed' => 0,
            'discount' => 0,
        ]);
    }
}
