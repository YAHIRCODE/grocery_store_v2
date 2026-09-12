<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Sale extends Model
{
    use HasFactory;
    protected $fillable = [
    'sale_group_id',
    'product_id',
    'quantity',
    'unit_type',
    'total_price',
    'employee_id',
    'client_id',
    'cash_register_id',
    'payment_method',
    'card_reference',
    'cash_amount',
    'card_amount',
    'change_amount',
    'status',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
            'cash_amount' => 'decimal:2',
            'card_amount' => 'decimal:2',
            'change_amount' => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function cashRegister(): BelongsTo
    {
        return $this->belongsTo(CashRegister::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function cancel(): bool
    {
        if ($this->isCancelled()) {
            return false;
        }

        $this->update(['status' => 'cancelled']);

        $product = Product::find($this->product_id);
        if ($product) {
            $product->increment('stock', $this->quantity);
        }

        return true;
    }

    public function revert(): bool
    {
        if (!$this->isCancelled()) {
            return false;
        }

        $product = Product::find($this->product_id);
        if ($product && $product->stock < $this->quantity) {
            return false;
        }

        $this->update(['status' => 'completed']);

        if ($product) {
            $product->decrement('stock', $this->quantity);
        }

        return true;
    }

    public function scopeOfTicket($query, string $saleGroupId)
    {
        return $query->where('sale_group_id', $saleGroupId);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }
}
