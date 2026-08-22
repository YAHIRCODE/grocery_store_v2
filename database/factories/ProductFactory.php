<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $products = [
            ['name' => 'Coca-Cola 600ml', 'barcode' => '7501020528012', 'description' => 'Refresco de cola 600ml'],
            ['name' => 'Leche Lala 1L', 'barcode' => '7501066700018', 'description' => 'Leche entera 1 litro'],
            ['name' => 'Huevos San Juan 12pzs', 'barcode' => '7501028470011', 'description' => 'Docena de huevos blancos'],
            ['name' => 'Arroz Morelos 1kg', 'barcode' => '7501053600014', 'description' => 'Arroz grano largo 1kg'],
            ['name' => 'Frijol Negro Del Monte 900g', 'barcode' => '7501022510012', 'description' => 'Frijol negro premium'],
            ['name' => 'Aceite Capullo 1L', 'barcode' => '7501025600017', 'description' => 'Aceite vegetal de canola 1L'],
            ['name' => 'Jabón Zote 200g', 'barcode' => '7501020110010', 'description' => 'Jabon de tocador barra'],
            ['name' => 'Papel Bono 4 rollos', 'barcode' => '7501030200016', 'description' => 'Papel higienico 4 rollos'],
            ['name' => 'Atún Dolores 140g', 'barcode' => '7501021500013', 'description' => 'Atun en agua 140g'],
            ['name' => 'Café soluble Nescafé 95g', 'barcode' => '7501001000011', 'description' => 'Cafe instantaneo clasico'],
            ['name' => 'Sabritas Original 45g', 'barcode' => '7501071100019', 'description' => 'Papas fritas sabor original'],
            ['name' => 'Galletas Gamesa 170g', 'barcode' => '7501046000015', 'description' => 'Galletas de grasa marinela'],
            ['name' => 'Jabón de Manos Protex', 'barcode' => '7501023200018', 'description' => 'Jabon liquido antibacterial'],
            ['name' => 'Cloro Cloralex 1L', 'barcode' => '7501027100014', 'description' => 'Cloro concentrado para limpieza'],
            ['name' => 'Tortillas de Maiz 1kg', 'barcode' => '7501033300012', 'description' => 'Tortillas de maiz frescas'],
        ];

        $product = fake()->randomElement($products);

        return [
            'category_id' => Category::factory(),
            'supplier_id' => fake()->optional(0.8)->passthrough(fn () => Supplier::factory()->create()->id),
            'name' => $product['name'],
            'barcode' => $product['barcode'],
            'description' => $product['description'],
            'stock' => fake()->numberBetween(10, 200),
            'min_stock' => fake()->numberBetween(5, 20),
            'purchase_price' => fake()->randomFloat(2, 5, 150),
            'price' => fake()->randomFloat(2, 10, 250),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => [
            'is_active' => false,
        ]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn () => [
            'stock' => 0,
        ]);
    }

    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => fake()->numberBetween(1, $attributes['min_stock'] ?? 10),
        ]);
    }
}
