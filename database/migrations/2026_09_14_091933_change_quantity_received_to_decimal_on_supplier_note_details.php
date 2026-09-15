<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Permite recibir peso variable (ej. 950g/0.95kg de queso suelto)
        // en vez de forzar un entero fijo como lo pactado.
        DB::statement('ALTER TABLE supplier_note_details MODIFY quantity_received DECIMAL(10,2) NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE supplier_note_details MODIFY quantity_received INT NULL');
    }
};
