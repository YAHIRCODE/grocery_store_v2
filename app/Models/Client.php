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

    protected $appends = ['current_debt'];

    protected function casts(): array
    {
        return ['credit_limit' => 'decimal:2'];
    }

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
