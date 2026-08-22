<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderFundMovement extends Model
{
    use HasFactory;
    protected $fillable = [
        'provider_fund_id', 'employee_id', 'type', 'amount', 'reason',
    ];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2'];
    }

    public function providerFund(): BelongsTo
    {
        return $this->belongsTo(ProviderFund::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
