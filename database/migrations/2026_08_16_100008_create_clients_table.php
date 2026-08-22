<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->decimal('credit_limit', 10, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();

            // FIX 1: NO existe current_debt aqui.
            // Se calcula dinamicamente: client_debts->where('status', '!=', 'paid')->sum('balance_due')
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
