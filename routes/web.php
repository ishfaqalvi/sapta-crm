<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\{
    AuthenticatedSessionController,
    PasswordResetLinkController,
    NewPasswordController
};
use App\Http\Controllers\ClientPortal\{
    OverviewController,
    ProjectController,
    ClientServiceController,
    InvoiceController as ClientInvoiceController,
    QuotationController as ClientQuotationController,
    CredentialController as ClientCredentialController,
    ProfileController as ClientProfileController,
    ReportController as ClientReportController,
    DomainController as ClientDomainPortalController,
    HostingController as ClientHostingPortalController
};
use App\Http\Controllers\{
    DashboardController,
    ClientController,
    CredentialController,
    EmployeeController,
    PayrollController,
    ProjectCategoryController,
    ServiceCategoryController,
    IncomeCategoryController,
    ExpenseCategoryController,
    IncomeController,
    ExpenseController,
    DesignationController,
    DepartmentController,
    CurrencyController,
    UserController,
    RoleController,
    TaskCategoryController,
    TaskController,
    ClientDomainController,
    ClientHostingController,
    InvoiceController,
    ReportController,
    NotificationController,
    MyTaskController,
    TaskMessageController,
    DatabaseBackupController
};
use App\Http\Controllers\Settings\{
    ProfileController,
    SystemSettingsController
};

/*
|--------------------------------------------------------------------------
| Authentication & Password Reset Routes (Guest)
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::controller(AuthenticatedSessionController::class)->group(function () {
        Route::get('/', 'create')->name('login');
        Route::post('/', 'store')->name('login.store');
        Route::get('login', fn() => redirect('/'));
        Route::post('login', 'store');
    });

    Route::controller(PasswordResetLinkController::class)->group(function () {
        Route::get('forgot-password', 'create')->name('password.request');
        Route::post('forgot-password', 'store')->name('password.email');
    });

    Route::controller(NewPasswordController::class)->group(function () {
        Route::get('reset-password/{token}', 'create')->name('password.reset');
        Route::post('reset-password', 'store')->name('password.store');
    });
});

/*
|--------------------------------------------------------------------------
| Common Authenticated Routes (Accessible to all authenticated users)
|--------------------------------------------------------------------------
*/
Route::middleware(['web', 'auth'])->group(function () {
    Route::post('profile/logout', [ProfileController::class, 'logout'])->name('profile.logout');
    Route::post('logout', [ProfileController::class, 'logout'])->name('logout');

    // Notification Center & Actions
    Route::controller(NotificationController::class)->prefix('notifications')->as('notifications.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('{id}/read', 'markAsRead')->name('read');
        Route::post('mark-all-read', 'markAllAsRead')->name('markAllRead');
        Route::delete('{id}', 'destroy')->name('destroy');
        Route::delete('clear-all', 'clearAll')->name('clearAll');
    });

    // My Assigned Tasks (Employee Portal)
    Route::controller(MyTaskController::class)->prefix('my-tasks')->as('my-tasks.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('{task}/status', 'updateStatus')->name('status');
        Route::put('{task}/status', 'updateStatus');
        Route::post('service-task/{task}/status', 'updateServiceTaskStatus')->name('service-task.status');
        Route::put('service-task/{task}/status', 'updateServiceTaskStatus');
    });

    // Dedicated Task Detail & Discussion Page
    Route::controller(TaskMessageController::class)->prefix('tasks')->as('tasks.')->group(function () {
        Route::get('detail/{type}/{id}', 'show')->name('detail');
        Route::post('detail/{type}/{id}/status', 'updateStatus')->name('detail.status');
    });

    // Task Conversation & Discussion Routes
    Route::controller(TaskMessageController::class)->prefix('task-messages')->as('task-messages.')->group(function () {
        Route::get('{type}/{id}', 'index')->name('index');
        Route::post('store', 'store')->name('store');
        Route::delete('destroy/{message}', 'destroy')->name('destroy');
        Route::post('destroy/{message}', 'destroy');
    });
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
    Route::controller(ProjectController::class)->group(function () {
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
            Route::post('milestones/{milestone}/generate-invoice', 'generateMilestoneInvoice')->name('milestones.generate-invoice');
            Route::post('milestones/{milestone}/mark-as-paid', 'markMilestoneAsPaid')->name('milestones.mark-as-paid');

            // Credentials Sub-routes
            Route::post('credentials/store', 'storeCredential')->name('credentials.store');
            Route::put('credentials/update/{credential}', 'updateCredential')->name('credentials.update');
            Route::delete('credentials/destroy/{credential}', 'destroyCredential')->name('credentials.destroy');

            // Documents Sub-routes
            Route::post('{project}/documents/store', 'storeDocument')->name('documents.store');
            Route::delete('{project}/documents/destroy/{document}', 'destroyDocument')->name('documents.destroy');
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Services Routes (Full CRUD)
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientServiceController::class)->group(function () {
        Route::prefix('services')->as('services.')->group(function () {
            Route::get('/', 'index')->name('index');
            Route::post('store', 'store')->name('store');

            Route::post('payments/generate', 'generateMonthlyBatch')->name('payments.generate');
            Route::post('payments/{servicePayment}/generate-invoice', 'generatePaymentInvoice')->name('payments.generate-invoice');
            Route::post('payments/{servicePayment}/mark-as-paid', 'markPaymentAsPaid')->name('payments.mark-as-paid');
            Route::post('payments/{servicePayment}/split', 'splitPayment')->name('payments.split');
            Route::post('payments/{servicePayment}/merge', 'mergePayment')->name('payments.merge');
            Route::put('payments/update/{servicePayment}', 'updatePayment')->name('payments.update');
            Route::delete('payments/destroy/{servicePayment}', 'destroyPayment')->name('payments.destroy');

            Route::get('{service}', 'show')->name('show');
            Route::put('update/{service}', 'update')->name('update');
            Route::delete('destroy/{service}', 'destroy')->name('destroy');

            // Tasks Sub-routes
            Route::post('tasks/store', 'storeTask')->name('tasks.store');
            Route::put('tasks/update/{task}', 'updateTask')->name('tasks.update');
            Route::post('tasks/update/{task}', 'updateTask');
            Route::post('tasks/{task}/status', 'updateTaskStatus')->name('tasks.status');
            Route::put('tasks/{task}/status', 'updateTaskStatus');
            Route::delete('tasks/destroy/{task}', 'destroyTask')->name('tasks.destroy');

            Route::post('credentials/store', 'storeCredential')->name('credentials.store');
            Route::put('credentials/update/{credential}', 'updateCredential')->name('credentials.update');
            Route::delete('credentials/destroy/{credential}', 'destroyCredential')->name('credentials.destroy');

            Route::post('{service}/documents/store', 'storeDocument')->name('documents.store');
            Route::delete('{service}/documents/destroy/{document}', 'destroyDocument')->name('documents.destroy');
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
        Route::post('/', 'store');
        Route::post('store', 'store')->name('store');
        Route::get('{invoice}', 'show')->name('show');
        Route::get('{invoice}/edit', 'edit')->name('edit');
        Route::put('update/{invoice}', 'update')->name('update');
        Route::patch('{invoice}/status', 'updateStatus')->name('status');
        Route::delete('destroy/{invoice}', 'destroy')->name('destroy');
        Route::get('{invoice}/pdf', 'pdf')->name('pdf');
    });

    /*
    |--------------------------------------------------------------------------
    | Quotations & Proposals Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientQuotationController::class)->prefix('quotations')->as('quotations.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('create', 'create')->name('create');
        Route::post('store', 'store')->name('store');
        Route::get('{quotation}', 'show')->name('show');
        Route::get('{quotation}/edit', 'edit')->name('edit');
        Route::put('{quotation}', 'update');
        Route::put('update/{quotation}', 'update')->name('update');
        Route::post('{quotation}', 'update');
        Route::post('update/{quotation}', 'update');
        Route::patch('{quotation}/status', 'updateStatus')->name('status');
        Route::delete('{quotation}', 'destroy');
        Route::delete('destroy/{quotation}', 'destroy')->name('destroy');
        Route::get('{quotation}/pdf', 'pdf')->name('pdf');
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
    | Client Portal Domains Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientDomainPortalController::class)->prefix('domains')->as('domains.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('store', 'store')->name('store');
        Route::get('{domain}', 'show')->name('show');
        Route::put('update/{domain}', 'update')->name('update');
        Route::post('{domain}/generate-invoice', 'generateInvoice')->name('generate-invoice');
        Route::delete('destroy/{domain}', 'destroy')->name('destroy');

        // Domain Payments & Renewals Flow (Aligned with Projects)
        Route::post('payments/store', 'storePayment')->name('payments.store');
        Route::put('payments/update/{payment}', 'updatePayment')->name('payments.update');
        Route::delete('payments/destroy/{payment}', 'destroyPayment')->name('payments.destroy');
        Route::post('payments/{payment}/generate-invoice', 'generatePaymentInvoice')->name('payments.generate-invoice');
        Route::post('payments/{payment}/mark-as-paid', 'markPaymentAsPaid')->name('payments.mark-as-paid');
    });

    /*
    |--------------------------------------------------------------------------
    | Client Portal Hostings Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientHostingPortalController::class)->prefix('hostings')->as('hostings.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('store', 'store')->name('store');
        Route::get('{hosting}', 'show')->name('show');
        Route::put('update/{hosting}', 'update')->name('update');
        Route::post('{hosting}/generate-invoice', 'generateInvoice')->name('generate-invoice');
        Route::delete('destroy/{hosting}', 'destroy')->name('destroy');

        // Hosting Payments & Renewals Flow (Aligned with Projects & Domains)
        Route::post('payments/store', 'storePayment')->name('payments.store');
        Route::put('payments/update/{payment}', 'updatePayment')->name('payments.update');
        Route::delete('payments/destroy/{payment}', 'destroyPayment')->name('payments.destroy');
        Route::post('payments/{payment}/generate-invoice', 'generatePaymentInvoice')->name('payments.generate-invoice');
        Route::post('payments/{payment}/mark-as-paid', 'markPaymentAsPaid')->name('payments.mark-as-paid');
    });

    /*
   |--------------------------------------------------------------------------
   | Client Reports & Financial Statements Routes
   |--------------------------------------------------------------------------
   */
    Route::controller(ClientReportController::class)->prefix('reports')->as('reports.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('pdf', 'pdf')->name('pdf');
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
        Route::post('/', 'store')->name('store');
        Route::post('store', 'store');
        Route::get('{client}', 'show')->name('show');
        Route::get('view/{client}', 'show');
        Route::get('{client}/edit', 'edit')->name('edit');
        Route::get('edit/{client}', 'edit');
        Route::put('{client}', 'update')->name('update');
        Route::post('update/{client}', 'update');
        Route::put('update/{client}', 'update');
        Route::delete('{client}', 'destroy')->name('destroy');
        Route::delete('destroy/{client}', 'destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Credentials Directory Routes (Read-Only Directory Listing & Full CRUD)
    |--------------------------------------------------------------------------
    */
    Route::controller(CredentialController::class)->prefix('credentials')->as('credentials.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('store', 'store')->name('store');
        Route::put('update/{credential}', 'update')->name('update');
        Route::delete('destroy/{credential}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Admin Invoices & Billing Routes (Read-Only Directory & View)
    |--------------------------------------------------------------------------
    */
    Route::controller(InvoiceController::class)->prefix('invoices')->as('invoices.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('{invoice}', 'show')->name('show');
        Route::get('{invoice}/pdf', 'downloadPdf')->name('pdf');
    });

    /*
    |--------------------------------------------------------------------------
    | Financial Reports & Ledger Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(ReportController::class)->prefix('reports')->as('reports.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/pdf', 'pdf')->name('pdf');
    });

    /*
    |--------------------------------------------------------------------------
    | Income Tracker Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(IncomeController::class)->prefix('incomes')->as('incomes.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/export', 'export')->name('export');
        Route::post('/', 'store')->name('store');
        Route::put('/{income}', 'update')->name('update');
        Route::delete('/{income}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Expense Tracker Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(ExpenseController::class)->prefix('expenses')->as('expenses.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/export', 'export')->name('export');
        Route::post('/', 'store')->name('store');
        Route::put('/{expense}', 'update')->name('update');
        Route::delete('/{expense}', 'destroy')->name('destroy');
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
        Route::get('/payslip/{payroll}', 'showPayslip')->name('payslip');
        Route::get('/payslips-bulk', 'bulkPayslips')->name('payslips-bulk');
        Route::delete('/{payroll}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | General Tasks Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(TaskController::class)->prefix('tasks')->as('tasks.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/create', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{task}/edit', 'edit')->name('edit');
        Route::put('/{task}', 'update')->name('update');
        Route::get('/{task}/download-attachment', 'downloadAttachment')->name('download-attachment');
        Route::patch('/{task}/status', 'updateStatus')->name('status');
        Route::delete('/{task}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Client Domains Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientDomainController::class)->prefix('client-domains')->as('client-domains.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/create', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{clientDomain}/edit', 'edit')->name('edit');
        Route::put('/{clientDomain}', 'update')->name('update');
        Route::patch('/{clientDomain}/status', 'updateStatus')->name('status');
        Route::delete('/{clientDomain}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Client Hostings Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(ClientHostingController::class)->prefix('client-hostings')->as('client-hostings.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/create', 'create')->name('create');
        Route::post('/', 'store')->name('store');
        Route::get('/{clientHosting}/edit', 'edit')->name('edit');
        Route::put('/{clientHosting}', 'update')->name('update');
        Route::patch('/{clientHosting}/status', 'updateStatus')->name('status');
        Route::delete('/{clientHosting}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Task Categories Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(TaskCategoryController::class)->prefix('task-categories')->as('task-categories.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::put('/{taskCategory}', 'update')->name('update');
        Route::delete('/{taskCategory}', 'destroy')->name('destroy');
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
    | Income Categories Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(IncomeCategoryController::class)->prefix('income-categories')->as('income-categories.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::put('/{incomeCategory}', 'update')->name('update');
        Route::delete('/{incomeCategory}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Expense Categories Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(ExpenseCategoryController::class)->prefix('expense-categories')->as('expense-categories.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::put('/{expenseCategory}', 'update')->name('update');
        Route::delete('/{expenseCategory}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Department Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(DepartmentController::class)->prefix('departments')->as('departments.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::put('/{department}', 'update')->name('update');
        Route::delete('/{department}', 'destroy')->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Sub-Department Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(DepartmentController::class)->prefix('sub-departments')->as('sub-departments.')->group(function () {
        Route::post('/', 'storeSubDepartment')->name('store');
        Route::put('/{subDepartment}', 'updateSubDepartment')->name('update');
        Route::delete('/{subDepartment}', 'destroySubDepartment')->name('destroy');
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
        Route::get('create', 'create')->name('create');
        Route::post('store', 'store')->name('store');
        Route::get('edit/{user}', 'edit')->name('edit');
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
        Route::get('/create', 'create')->name('create');
        Route::post('/store', 'store')->name('store');
        Route::get('/edit/{role}', 'edit')->name('edit');
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

    /*
    |--------------------------------------------------------------------------
    | Database Backup & System Recovery Routes
    |--------------------------------------------------------------------------
    */
    Route::controller(DatabaseBackupController::class)->prefix('database-backups')->as('database-backups.')->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('create', 'create')->name('create');
        Route::get('download/{filename}', 'download')->name('download');
        Route::delete('destroy/{filename}', 'destroy')->name('destroy');
    });
});