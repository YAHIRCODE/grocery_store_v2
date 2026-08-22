<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\InventoryAdjustmentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\ClientDebtController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\SupplierDebtController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CashRegisterController;
use App\Http\Controllers\Api\SupplierNoteController;
use App\Http\Controllers\Api\ProviderFundController;
use App\Http\Controllers\Api\ReportController;


// Test básico
Route::get('/test', function () {
    return response()->json([
        'message' => 'Api funcionando correctamente'
    ]);
});


// Login
Route::post('/login', [AuthController::class, 'login']);


// Usuario autenticado
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});


// Ventas
// Ventas
Route::middleware(['auth:sanctum', 'role:Cajero,Administrador'])->group(function () {
    Route::apiResource('sales', SaleController::class);
    Route::post('sales/{id}/cancel', [SaleController::class, 'cancel']);
    Route::post('sales/group/{saleGroupId}/cancel', [SaleController::class, 'cancelGroup']);
});

Route::middleware(['auth:sanctum', 'role:Administrador'])->group(function () {
    Route::post('sales/{id}/revert', [SaleController::class, 'revert']);
});


// Ajustes de inventario
Route::middleware(['auth:sanctum', 'role:Almacenista,Administrador'])->group(function () {
    Route::apiResource('inventory-adjustments', InventoryAdjustmentController::class);
});


// Empleados
Route::middleware(['auth:sanctum', 'role:Administrador'])->group(function () {
    Route::apiResource('employees', EmployeeController::class);
});

// Roles
Route::middleware(['auth:sanctum', 'role:Administrador'])->group(function () {
    Route::apiResource('roles', RoleController::class);
});

// Productos
Route::middleware(['auth:sanctum', 'role:Almacenista,Administrador,Cajero'])->group(function () {
    Route::get('products/trashed', [ProductController::class, 'trashed']);
    Route::post('products/{id}/restore', [ProductController::class, 'restore']);
    Route::delete('products/{id}/force-delete', [ProductController::class, 'forceDelete']);
    Route::post('products/match', [ProductController::class, 'match']);
    Route::post('product-supplier-codes', [ProductController::class, 'storeSupplierCode']);
    Route::apiResource('products', ProductController::class);
});

// Categorías
Route::middleware(['auth:sanctum', 'role:Almacenista,Administrador'])->group(function () {
    Route::apiResource('categories', CategoryController::class);
});

// Clientes y deudas de clientes
Route::middleware(['auth:sanctum', 'role:Cajero,Administrador'])->group(function () {
    Route::get('clients/trashed', [ClientController::class, 'trashed']);
    Route::post('clients/{id}/restore', [ClientController::class, 'restore']);
    Route::apiResource('clients', ClientController::class);
    Route::apiResource('client-debts', ClientDebtController::class);
    Route::post('client-debts/{id}/pay', [ClientDebtController::class, 'pay']);
});

// Proveedores y deudas
Route::middleware(['auth:sanctum', 'role:Administrador'])->group(function () {
    Route::apiResource('suppliers', SupplierController::class);
    Route::apiResource('supplier-debts', SupplierDebtController::class);
});

// Dashboard
Route::middleware(['auth:sanctum', 'role:Administrador'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index']);
    Route::get('dashboard/reportes/ventas', [DashboardController::class, 'reporteVentas']);
    Route::get('dashboard/reportes/productos', [DashboardController::class, 'reporteProductos']);
    Route::get('dashboard/reportes/clientes', [DashboardController::class, 'reporteClientes']);
    Route::get('dashboard/reportes/deudas', [DashboardController::class, 'reporteDeudas']);
});

//corte de caja
Route::middleware(['auth:sanctum', 'role:Cajero,Administrador'])->group(function () {
    Route::get('cash-registers/active', [CashRegisterController::class, 'active']);
    Route::post('cash-registers/open', [CashRegisterController::class, 'open']);
    Route::get('cash-registers', [CashRegisterController::class, 'index']);
    Route::get('cash-registers/{id}', [CashRegisterController::class, 'show']);
    Route::post('cash-registers/{id}/close', [CashRegisterController::class, 'close']);
});



Route::middleware(['auth:sanctum', 'role:Administrador,Almacenista,Cajero'])->group(function () {
    Route::get('supplier-notes', [SupplierNoteController::class, 'index']);
    Route::get('supplier-notes/historial', [SupplierNoteController::class, 'historial']);
    Route::get('supplier-notes/{id}', [SupplierNoteController::class, 'show']);
    Route::post('supplier-notes', [SupplierNoteController::class, 'store']);
    Route::put('supplier-notes/{id}', [SupplierNoteController::class, 'update']);
    Route::delete('supplier-notes/{id}', [SupplierNoteController::class, 'destroy']);
    Route::post('supplier-notes/{id}/scan', [SupplierNoteController::class, 'scan']);
    Route::put('supplier-notes/{id}/confirm', [SupplierNoteController::class, 'confirm']);
    Route::put('supplier-notes/{id}/pay', [SupplierNoteController::class, 'pay']);
});

Route::middleware(['auth:sanctum', 'role:Administrador,Almacenista'])->group(function () {
    Route::get('provider-funds', [ProviderFundController::class, 'index']);
    Route::get('provider-funds/{id}', [ProviderFundController::class, 'show']);
    Route::put('provider-funds/{id}', [ProviderFundController::class, 'update']);
    Route::post('provider-funds/{id}/extract', [ProviderFundController::class, 'extract']);
});

// Reportes exportables (PDF y CSV)
Route::middleware(['auth:sanctum', 'role:Administrador'])->group(function () {
    Route::get('reportes/dashboard/pdf', [ReportController::class, 'dashboardPdf']);
    Route::get('reportes/dashboard/csv', [ReportController::class, 'dashboardCsv']);
});
