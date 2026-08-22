<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        $categories = [
            ['name' => 'Abarrotes', 'description' => 'Productos basicos de abarrotes'],
            ['name' => 'Bebidas', 'description' => 'Refrescos, jugos y agua'],
            ['name' => 'Lacteos', 'description' => 'Leche, queso, crema y yogur'],
            ['name' => 'Carnes', 'description' => 'Carnes frescas y embutidos'],
            ['name' => 'Frutas y Verduras', 'description' => 'Productos frescos del huerto'],
            ['name' => 'Panaderia', 'description' => 'Pan, pasteleria y reposteria'],
            ['name' => 'Limpieza', 'description' => 'Productos de limpieza del hogar'],
            ['name' => 'Higiene Personal', 'description' => 'Jabones, shampoo y articulos de higiene'],
            ['name' => 'Snacks', 'description' => 'Botanas y dulces'],
            ['name' => 'Abarrotes Secos', 'description' => 'Arroz, frijol, pasta y aceite'],
        ];

        $category = fake()->randomElement($categories);

        return [
            'name' => $category['name'],
            'description' => $category['description'],
        ];
    }
}
