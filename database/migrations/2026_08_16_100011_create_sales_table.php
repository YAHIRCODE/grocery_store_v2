<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            // sale_group_id: UUID que agrupa todas las filas del mismo TICKET.
            // Ejemplo: si un cliente compra 3 productos, hay 3 filas en sales,
            // todas con el mismo sale_group_id. NO es FK, es un string agrupador.
            $table->uuid('sale_group_id')->index();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('cash_register_id')->constrained()->restrictOnDelete();
            $table->integer('quantity');
            $table->enum('unit_type', ['unit', 'package', 'weight'])->default('unit');

            // FIX 2: unit_price guarda el precio unitario al momento de la venta.
            // Si el precio del producto cambia despues, este valorHistorico se preserva.
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);

            // Prorrateo: cuando el pago es mixto (efectivo + tarjeta),
            // cada linea recibe su proporcion exacta del pago total del ticket.
            $table->decimal('cash_amount', 10, 2)->default(0);
            $table->decimal('card_amount', 10, 2)->default(0);
            $table->enum('payment_method', ['cash', 'card', 'credit', 'mixed'])->default('cash');
            $table->enum('status', ['completed', 'cancelled'])->default('completed');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
