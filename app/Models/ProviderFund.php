<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProviderFund extends Model
{
    use HasFactory;
    protected $fillable = [
        'defined_amount', 'extraction_limit',
        'available_balance', 'notes', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'defined_amount' => 'decimal:2',
            'extraction_limit' => 'decimal:2',
            'available_balance' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function movements(): HasMany
    {
        return $this->hasMany(ProviderFundMovement::class);
    }
}
