<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['company_name', 'contact_name', 'phone', 'email'];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function supplierCodes(): HasMany
    {
        return $this->hasMany(ProductSupplierCode::class);
    }

    public function supplierNotes(): HasMany
    {
        return $this->hasMany(SupplierNote::class);
    }

    public function supplierDebts(): HasMany
    {
        return $this->hasMany(SupplierDebt::class);
    }

    public function debts(): HasMany
    {
        return $this->supplierDebts();
    }
}
