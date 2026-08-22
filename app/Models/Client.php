<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Client extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'first_name', 'last_name', 'phone', 'email', 'credit_limit',
    ];

    protected function casts(): array
    {
        return ['credit_limit' => 'decimal:2'];
    }

    /**
     * FIX 1: Deuda actual calculada dinamicamente.
     * En v1 existia una columna current_debt que NUNCA se actualizaba.
     * Ahora se calcula en tiempo real sumando las deudas no pagadas.
     */
    public function getCurrentDebtAttribute(): float
    {
        return $this->debts()
            ->where('status', '!=', 'paid')
            ->sum('balance_due');
    }

    public function debts(): HasMany
    {
        return $this->hasMany(ClientDebt::class);
    }
}
