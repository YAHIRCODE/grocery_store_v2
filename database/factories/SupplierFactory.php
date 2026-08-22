<?php

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Supplier>
 */
class SupplierFactory extends Factory
{
    protected $model = Supplier::class;

    public function definition(): array
    {
        $companies = [
            'Distribuidora La Merced S.A. de C.V.',
            'Bodega Mayorista del Centro',
            'Abarrotes Unidos de Guadalajara',
            'Productos del Norte S. de R.L.',
            'Distribuidora Jalisco Premium',
            'La Costeña S.A. de C.V.',
            'Alimentos Corona S.A.',
            'Distribuidora Benito Juárez',
        ];

        return [
            'company_name' => fake()->unique()->randomElement($companies),
            'contact_name' => fake()->name(),
            'phone' => '33' . fake()->numerify('#######'),
            'email' => fake()->unique()->companyEmail(),
        ];
    }
}
