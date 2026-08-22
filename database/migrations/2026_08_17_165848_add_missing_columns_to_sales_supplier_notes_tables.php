<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('employee_id')->nullable()->after('cash_register_id')->constrained()->nullOnDelete();
            $table->foreignId('client_id')->nullable()->after('employee_id')->constrained()->nullOnDelete();
            $table->decimal('change_amount', 10, 2)->default(0)->after('status');
        });

        Schema::table('supplier_notes', function (Blueprint $table) {
            $table->date('delivery_date')->nullable()->after('status');
            $table->text('reminders')->nullable()->after('delivery_date');
            $table->foreignId('created_by')->nullable()->after('reminders')->constrained('employees')->nullOnDelete();
            $table->foreignId('confirmed_by')->nullable()->after('created_by')->constrained('employees')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable()->after('confirmed_by');
        });

        Schema::table('supplier_note_details', function (Blueprint $table) {
            $table->decimal('discount', 10, 2)->default(0)->after('price_agreed');
            $table->boolean('is_gift')->default(false)->after('discount');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['employee_id']);
            $table->dropForeign(['client_id']);
            $table->dropColumn(['employee_id', 'client_id', 'change_amount']);
        });

        Schema::table('supplier_notes', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
            $table->dropForeign(['confirmed_by']);
            $table->dropColumn(['delivery_date', 'reminders', 'created_by', 'confirmed_by', 'confirmed_at']);
        });

        Schema::table('supplier_note_details', function (Blueprint $table) {
            $table->dropColumn(['discount', 'is_gift']);
        });
    }
};
