<?php

namespace Database\Factories;

use App\Models\Employee;
use App\Models\ProviderFund;
use App\Models\ProviderFundMovement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProviderFundMovement>
 */
class ProviderFundMovementFactory extends Factory
{
    protected $model = ProviderFundMovement::class;

    public function definition(): array
    {
        $reasons = [
            'Reposicion de efectivo para caja chica',
            'Compra de suministros de oficina',
            'Pago a proveedor local',
            'Deposito de fondos',
            'Retiro para gastos operativos',
            'Reembolso a empleado',
            'Fondo de emergencia',
        ];

        return [
            'provider_fund_id' => ProviderFund::factory(),
            'employee_id' => Employee::factory(),
            'type' => fake()->randomElement(['extraction', 'deposit']),
            'amount' => fake()->randomFloat(2, 100, 10000),
            'reason' => fake()->randomElement($reasons),
        ];
    }

    public function extraction(): static
    {
        return $this->state(fn () => [
            'type' => 'extraction',
        ]);
    }

    public function deposit(): static
    {
        return $this->state(fn () => [
            'type' => 'deposit',
        ]);
    }
}
