<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientDebt extends Model
{
    use HasFactory;
    protected $fillable = ['client_id', 'sale_group_id', 'start_date', 'due_date', 'balance_due', 'original_amount', 'status'];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'due_date' => 'date',
            'balance_due' => 'decimal:2',
            'original_amount' => 'decimal:2',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
