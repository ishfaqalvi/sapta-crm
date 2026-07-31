<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DesignationController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\ProjectPaymentController;
use App\Http\Controllers\ProjectTaskController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SeoPaymentController;
use App\Http\Controllers\SeoRetainerController;
use App\Http\Controllers\WebsiteProjectController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SystemSettingsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvoiceController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Home route / serves the login page for GET and handles authentication for POST
Route::get('/', [AuthenticatedSessionController::class, 'create'])->name('login');
Route::post('/', [AuthenticatedSessionController::class, 'store']);

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Users Management CRUD
    Route::resource('users', UserController::class)->except(['create', 'edit', 'show']);

    // Client Management CRUD
    Route::resource('clients', ClientController::class);

    // SEO Retainers & Payments
    Route::resource('seo-retainers', SeoRetainerController::class);
    Route::post('seo-payments/generate', [SeoPaymentController::class, 'generateMonthlyBatch'])->name('seo-payments.generate');
    Route::resource('seo-payments', SeoPaymentController::class)->only(['index', 'update']);

    // Website Projects, Tasks & Payments
    Route::resource('website-projects', WebsiteProjectController::class);
    Route::resource('website-payments', ProjectPaymentController::class)->except(['create', 'edit', 'show']);
    Route::resource('project-tasks', ProjectTaskController::class)->parameters(['project-tasks' => 'task'])->except(['create', 'edit', 'show']);
    Route::patch('project-tasks/{task}/status', [ProjectTaskController::class, 'updateStatus'])->name('project-tasks.status');

    // Roles & Permissions CRUD
    Route::resource('roles', RoleController::class)->except(['create', 'edit', 'show']);

    // Department & Sub-Department Management
    Route::resource('departments', DepartmentController::class)->except(['create', 'edit', 'show']);
    Route::post('sub-departments', [DepartmentController::class, 'storeSubDepartment'])->name('sub-departments.store');
    Route::put('sub-departments/{subDepartment}', [DepartmentController::class, 'updateSubDepartment'])->name('sub-departments.update');
    Route::delete('sub-departments/{subDepartment}', [DepartmentController::class, 'destroySubDepartment'])->name('sub-departments.destroy');

    // Designations Management
    Route::resource('designations', DesignationController::class)->except(['create', 'edit', 'show']);

    // Employee Operations & Directory
    Route::resource('employees', EmployeeController::class);

    // Monthly Payroll & Salary Calculation Engine
    Route::get('payroll', [PayrollController::class, 'index'])->name('payroll.index');
    Route::post('payroll/generate', [PayrollController::class, 'generateBatch'])->name('payroll.generate');
    Route::put('payroll/{payroll}', [PayrollController::class, 'update'])->name('payroll.update');
    Route::patch('payroll/{payroll}/status', [PayrollController::class, 'updateStatus'])->name('payroll.status');

    // User Profile Route (/profile)
    Route::get('profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::match(['patch', 'post'], 'profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('profile/password', [PasswordController::class, 'update'])->name('password.update');

    // System Settings Route (/settings)
    Route::get('settings', [SystemSettingsController::class, 'index'])->name('settings.index');
    Route::post('settings', [SystemSettingsController::class, 'update'])->name('settings.update');

    // Dynamic Currencies CRUD Management (/currencies)
    Route::resource('currencies', CurrencyController::class)->names('currencies')->except(['create', 'edit', 'show']);

    // Invoices & PDF Receipts Engine (/invoices)
    Route::get('invoices/{invoice}/pdf', [InvoiceController::class, 'pdf'])->name('invoices.pdf');
    Route::patch('invoices/{invoice}/mark-paid', [InvoiceController::class, 'markPaid'])->name('invoices.mark-paid');
    Route::resource('invoices', InvoiceController::class);
});

require __DIR__ . '/auth.php';
