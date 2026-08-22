<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_debts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            // FIX 3: sale_group_id (string UUID) en vez de sale_id (FK a una sola fila).
            // Permite que una deuda apunte al TICKET COMPLETO (todas las lineas del mismo UUID),
            // no a una sola fila de sales.
            $table->string('sale_group_id', 36)->index();
            $table->date('start_date');
            $table->date('due_date');
            $table->decimal('balance_due', 10, 2);
            $table->enum('status', ['pending', 'paid', 'overdue'])->default('pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_debts');
    }
};
