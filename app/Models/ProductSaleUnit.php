<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductSaleUnit extends Model
{
    protected $fillable = ['product_id', 'unit_type', 'package_size', 'unit_price'];

    protected function casts(): array
    {
        return [
            'package_size' => 'integer',
            'unit_price' => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
