<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provider_funds', function (Blueprint $table) {
            $table->id();
            $table->decimal('defined_amount', 12, 2);
            $table->decimal('extraction_limit', 12, 2);
            $table->decimal('available_balance', 12, 2);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_funds');
    }
};
