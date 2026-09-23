<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierNoteDetail extends Model
{
    use HasFactory;
    protected $fillable = [
        'supplier_note_id',
        'product_id',
        'quantity_agreed',
        'quantity_received',
        'price_agreed',
        'discount',
        'is_gift',
    ];

    protected function casts(): array
    {
        return [
            'quantity_agreed' => 'decimal:2',
            'quantity_received' => 'decimal:2',
            'price_agreed' => 'decimal:2',
            'discount' => 'decimal:2',
            'is_gift' => 'boolean',
        ];
    }

    public function supplierNote(): BelongsTo
    {
        return $this->belongsTo(SupplierNote::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
