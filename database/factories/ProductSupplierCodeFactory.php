<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductSupplierCode;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductSupplierCode>
 */
class ProductSupplierCodeFactory extends Factory
{
    protected $model = ProductSupplierCode::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'supplier_id' => Supplier::factory(),
            'code' => strtoupper(fake()->bothify('??-#####')),
        ];
    }
}
