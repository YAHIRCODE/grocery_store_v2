<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_notes', function (Blueprint $table) {
            $table->foreignId('paid_by')->nullable()->after('confirmed_at')->constrained('employees')->nullOnDelete();
            $table->timestamp('paid_at')->nullable()->after('paid_by');
        });
    }

    public function down(): void
    {
        Schema::table('supplier_notes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('paid_by');
            $table->dropColumn('paid_at');
        });
    }
};
