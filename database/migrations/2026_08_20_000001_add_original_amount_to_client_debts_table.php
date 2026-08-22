<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('client_debts', function (Blueprint $table) {
            if (!Schema::hasColumn('client_debts', 'original_amount')) {
                $table->decimal('original_amount', 10, 2)->default(0)->after('balance_due');
            }
        });

        // Backfill: original_amount = balance_due for existing rows (they haven't been partially paid)
        DB::table('client_debts')
            ->where('original_amount', 0)
            ->update(['original_amount' => DB::raw('balance_due')]);
    }

    public function down(): void
    {
        Schema::table('client_debts', function (Blueprint $table) {
            $table->dropColumn('original_amount');
        });
    }
};
