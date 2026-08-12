<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ClientPortal\{
    OverviewController,
    ProjectController as ClientProjectController,
    ClientServiceController as ClientPortalServiceController,
    CredentialController as ClientCredentialController,
    InvoiceController as ClientInvoiceController,
    ProfileController as ClientProfileController,
    ReportController as ClientReportController
};
use App\Http\Controllers\{
    DashboardController,
    ClientController,
    ProjectController,
    ClientServiceController,
    InvoiceController,
    CredentialController,
    EmployeeController,
    PayrollController,
    ProjectCategoryController,
    ServiceCategoryController,
    DesignationController,
    DepartmentController,
    CurrencyController,
    UserController,
    RoleController
};
use App\Http\Controllers\Settings\{
    ProfileController,
    SystemSettingsController
};

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
    Route::controller(ClientProjectController::class)->group(function () {
        Route::prefix('projects')->as('projects.')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('create', 'create')->name('create');
            Route::post('store', 'store')->name('store');
            Route::get('{project}', 'show')->name('show');
            Route::get('{project}/edit', 'edit')->name('edit');
            Route::put('update/{project}', 'update')->name('update');
            Route::delete('destroy/{project}', 'destroy')->name('destroy');

            // Tasks Sub-routes
            Route::post('tasks/store', 'storeTask')->name('tasks.store');
            Route::put('tasks/update/{task}', 'updateTask')->name('tasks.update');
            Route::post('tasks/update/{task}', 'updateTask');
            Route::delete('tasks/destroy/{task}', 'destroyTask')->name('tasks.destroy');

            // Milestones Sub-routes
            Route::post('milestones/store', 'storeMilestone')->name('milestones.store');
            Route::post('milestones/update/{milestone}', 'updateMilestone');
            Route::put('milestones/update/{milestone}', 'updateMilestone')->name('milestones.update');
            Route::delete('milestones/destroy/{milestone}', 'destroyMilestone')->name('milestones.destroy');

            // Credentials Sub-routes
            Route::post('credentials/store', 'storeCredential')->name('credentials.store');
            Route::put('credentials/update/{credential}', 'updateCredential')->name('credentials.update');
            Route::delete('credentials/destroy/{credential}', 'destroyCredential')->name('credentials.destroy');
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Services Routes (Full CRUD)
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientPortalServiceController::class)->group(function () {
        Route::prefix('services')->as('services.')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('store', 'store')->name('store');

            Route::post('payments/generate', 'generateMonthlyBatch')->name('payments.generate');
            Route::put('payments/update/{servicePayment}', 'updatePayment')->name('payments.update');
            Route::delete('payments/destroy/{servicePayment}', 'destroyPayment')->name('payments.destroy');

            Route::get('{service}', 'show')->name('show');
            Route::put('update/{service}', 'update')->name('update');
            Route::delete('destroy/{service}', 'destroy')->name('destroy');
        });
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
    | Credentials Routes (Standalone General Logins & Access Keys)
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
   | Client Reports & Financial Statements Routes
   |--------------------------------------------------------------------------
   */
    Route::controller(ClientReportController::class)->prefix('reports')->as('reports.')->group(function () {
        Route::get('/', 'index')->name('index');
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

    /*
    |--------------------------------------------------------------------------
    | Project Routes (Read-Only Directory & Detail View)
    |--------------------------------------------------------------------------
    */
    Route::controller(ProjectController::class)->prefix('website-projects')->as('website-projects.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/{websiteProject}', 'show')->name('show');
    });

    /*
    |--------------------------------------------------------------------------
    | Client Services Directory Routes (Read-Only Directory & Detail View)
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientServiceController::class)->prefix('services')->as('services.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/{service}', 'show')->name('show');
    });


    /*
    |--------------------------------------------------------------------------
    | Invoices Directory Routes (Read-Only Directory & Detail View)
    |--------------------------------------------------------------------------
    */
    Route::controller(InvoiceController::class)->prefix('invoices')->as('invoices.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/{invoice}', 'show')->name('show');
        Route::get('/{invoice}/pdf', 'pdf')->name('pdf');
    });

    /*
    |--------------------------------------------------------------------------
    | Credentials Directory Routes (Read-Only Directory Listing)
    |--------------------------------------------------------------------------
    */
    Route::controller(CredentialController::class)->prefix('credentials')->as('credentials.')->group(function () {
        Route::get('/', 'index')->name('index');
    });

    /*
    |--------------------------------------------------------------------------
    | Employee Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(EmployeeController::class)->prefix('employees')->as('employees.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('create', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('{employee}/edit', 'edit')->name('edit');
        Route::get('{employee}/show', 'show')->name('show');
        Route::put('{employee}', 'update')->name('update');
        Route::delete('{employee}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Monthly Payroll Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(PayrollController::class)->prefix('payroll')->as('payroll.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('generate', 'generateBatch')->name('generate');
        Route::put('/{payroll}', 'update')->name('update');
        Route::patch('/{payroll}/status', 'updateStatus')->name('status');
    });

    /*
    |--------------------------------------------------------------------------
    | Project Categories Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(ProjectCategoryController::class)->prefix('project-categories')->as('project-categories.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::put('/{project_category}', 'update')->name('update');
        Route::delete('/{project_category}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Service Categories Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(ServiceCategoryController::class)->prefix('service-categories')->as('service-categories.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::put('/{service_category}', 'update')->name('update');
        Route::delete('/{service_category}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Department & Sub-Department Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(DepartmentController::class)->prefix('departments')->as('departments.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::put('/{department}', 'update')->name('update');
        Route::delete('/{department}', 'destroy')->name('destroy');
        Route::post('sub-departments', 'storeSubDepartment')->name('sub-departments.store');
        Route::put('sub-departments/{subDepartment}', 'updateSubDepartment')->name('sub-departments.update');
        Route::delete('sub-departments/{subDepartment}', 'destroySubDepartment')->name('sub-departments.destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Designation Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(DesignationController::class)->prefix('designations')->as('designations.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::put('/{designation}', 'update')->name('update');
        Route::delete('/{designation}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Currency Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(CurrencyController::class)->prefix('currencies')->as('currencies.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::put('/{currency}', 'update')->name('update');
        Route::delete('/{currency}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Users Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(UserController::class)->prefix('users')->as('users.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('store', 'store')->name('store');
        Route::post('update/{user}', 'update')->name('update');
        Route::delete('destroy/{user}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Role Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(RoleController::class)->prefix('roles')->as('roles.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/store', 'store')->name('store');
        Route::put('/update/{role}', 'update')->name('update');
        Route::delete('/destroy/{role}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Profile Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(ProfileController::class)->as('profile.')->group(function () {
        Route::get('profile', 'edit')->name('edit');
        Route::patch('profile', 'update')->name('update');
        Route::put('profile/password', 'updatePassword')->name('password.update');
        Route::post('profile/logout', 'logout')->name('logout');
    });

    /*
    |--------------------------------------------------------------------------
    | Settings Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(SystemSettingsController::class)->as('settings.')->group(function () {
        Route::get('settings', 'index')->name('index');
        Route::post('settings', 'update')->name('update');
    });
});