<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id', 'supplier_id', 'name', 'barcode',
        'description', 'stock', 'min_stock', 'purchase_price',
        'price', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'stock' => 'integer',
            'min_stock' => 'integer',
            'purchase_price' => 'decimal:2',
            'price' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function supplierCodes(): HasMany
    {
        return $this->hasMany(ProductSupplierCode::class);
    }

    public function saleUnits(): HasMany
    {
        return $this->hasMany(ProductSaleUnit::class);
    }

    public function inventoryAdjustments(): HasMany
    {
        return $this->hasMany(InventoryAdjustment::class);
    }

    public function supplierNoteDetails(): HasMany
    {
        return $this->hasMany(SupplierNoteDetail::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }
}
