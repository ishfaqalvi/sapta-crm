<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CredentialController;
use App\Http\Controllers\ClientPortal\{
    OverviewController,
    ProjectController as ClientProjectController,
    TaskController as ClientTaskController,
    MilestoneController as ClientMilestoneController,
    SeoRetainerController as ClientSeoRetainerController,
    SeoPaymentController as ClientSeoPaymentController,
    CredentialController as ClientCredentialController,
    InvoiceController as ClientInvoiceController,
    ProfileController as ClientProfileController
};
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DesignationController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\ProjectPaymentController;
use App\Http\Controllers\ProjectTaskController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SeoPaymentController;
use App\Http\Controllers\SeoRetainerController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SystemSettingsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WebsiteProjectController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Login Routes
|--------------------------------------------------------------------------
*/
Route::controller(AuthenticatedSessionController::class)->group(function () {
    Route::get('/', 'create')->name('login');
    Route::post('/', 'store')->name('login.store');
});

/*
|--------------------------------------------------------------------------
| Client Portal Routes
|--------------------------------------------------------------------------
*/
Route::group(['prefix' => 'client-portal', 'as' => 'client-portal.', 'middleware' => ['web', 'client.access']], function () {
    /*
    |--------------------------------------------------------------------------
    | Overview Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(OverviewController::class)->prefix('overview')->group(function () {
        Route::get('/', 'index')->name('overview.index');
    });

    /*
    |--------------------------------------------------------------------------
    | Projects Routes (Full CRUD)
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientProjectController::class)->prefix('projects')->as('projects.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('create', 'create')->name('create');
        Route::post('store', 'store')->name('store');
        Route::get('{project}', 'show')->name('show');
        Route::get('{project}/edit', 'edit')->name('edit');
        Route::put('update/{project}', 'update')->name('update');
        Route::delete('destroy/{project}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Tasks Routes (Full CRUD)
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientTaskController::class)->prefix('tasks')->as('tasks.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('store', 'store')->name('store');
        Route::put('update/{task}', 'update')->name('update');
        Route::post('update/{task}', 'update');
        Route::delete('destroy/{task}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Milestones & Budget Routes (Full CRUD)
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientMilestoneController::class)->prefix('milestones')->as('milestones.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('store', 'store')->name('store');
        Route::post('update/{milestone}', 'update');
        Route::delete('destroy/{milestone}', 'destroy')->name('destroy');
    });
    /*
    |--------------------------------------------------------------------------
    | SEO Retainers Routes (Full CRUD)
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientSeoRetainerController::class)->prefix('seo')->as('seo.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('store', 'store')->name('store');
        Route::put('update/{seoRetainer}', 'update')->name('update');
        Route::post('update/{seoRetainer}', 'update');
        Route::delete('destroy/{seoRetainer}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | SEO Retainer Payments Routes (Full CRUD & Batch Generation)
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientSeoPaymentController::class)->prefix('seo-payments')->as('seo-payments.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('generate-batch', 'generateMonthlyBatch')->name('generate-batch');
        Route::put('update/{seoPayment}', 'update')->name('update');
        Route::delete('destroy/{seoPayment}', 'destroy')->name('destroy');
    });
    /*
    |--------------------------------------------------------------------------
    | Credentials Routes (Full CRUD)
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientCredentialController::class)->prefix('credentials')->as('credentials.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('store', 'store')->name('store');
        Route::put('update/{credential}', 'update')->name('update');
        Route::delete('destroy/{credential}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Invoices & Billing Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientInvoiceController::class)->prefix('invoices')->as('invoices.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('create', 'create')->name('create');
        Route::post('store', 'store')->name('store');
        Route::get('{invoice}', 'show')->name('show');
        Route::get('{invoice}/edit', 'edit')->name('edit');
        Route::put('update/{invoice}', 'update')->name('update');
        Route::delete('destroy/{invoice}', 'destroy')->name('destroy');
        Route::get('{invoice}/pdf', 'pdf')->name('pdf');
    });

    /*
    |--------------------------------------------------------------------------
    | Client Profile & Account Settings Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientProfileController::class)->prefix('profile')->as('profile.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('update', 'updateProfile')->name('update');
        Route::put('password', 'updatePassword')->name('password');
        Route::post('avatar', 'updateAvatar')->name('avatar');
        Route::post('create-account', 'createAccount')->name('create-account');
        Route::put('reset-password', 'resetPassword')->name('reset-password');
        Route::delete('revoke-account', 'revokeAccount')->name('revoke-account');
    });
});

/*
|--------------------------------------------------------------------------
| Admin Portal Routes (Restricted to Admin Type Users Only)
|--------------------------------------------------------------------------
*/
Route::middleware(['web', 'admin.access'])->group(function () {
    /*
    |--------------------------------------------------------------------------
    | Dashboard Routes
    |--------------------------------------------------------------------------
    */
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | Client Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientController::class)->prefix('clients')->as('clients.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('create', 'create')->name('create');
        Route::post('store', 'store')->name('store');
        Route::get('view/{client}', 'show')->name('show');
        Route::get('edit/{client}', 'edit')->name('edit');
        Route::post('update/{client}', 'update')->name('update');
        Route::delete('destroy/{client}', 'destroy')->name('destroy');
    });

    // SEO Retainers & Payments
    Route::resource('seo-retainers', SeoRetainerController::class);
    Route::post('seo-payments/generate', [SeoPaymentController::class, 'generateMonthlyBatch'])->name('seo-payments.generate');
    Route::resource('seo-payments', SeoPaymentController::class)->only(['index', 'update']);

    // Website Projects, Tasks, Payments & Credentials
    Route::resource('website-projects', WebsiteProjectController::class);
    Route::resource('website-payments', ProjectPaymentController::class)->except(['create', 'edit', 'show']);
    Route::resource('project-tasks', ProjectTaskController::class)->parameters(['project-tasks' => 'task'])->except(['create', 'edit', 'show']);
    Route::patch('project-tasks/{task}/status', [ProjectTaskController::class, 'updateStatus'])->name('project-tasks.status');
    Route::resource('credentials', CredentialController::class)->except(['create', 'edit', 'show']);

    // Roles & Permissions CRUD
    Route::resource('roles', RoleController::class)->except(['create', 'edit', 'show']);
    Route::resource('users', UserController::class);

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
