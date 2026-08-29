<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\{Client, WebsiteProject, Currency, SystemSetting, Employee, ProjectTask, ProjectPayment, ClientCredential, ProjectCategory, Invoice, InvoiceItem};
use App\Services\CurrencyService;
use App\Traits\AuthorizesClientPortalAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    use AuthorizesClientPortalAccess;

    /**
     * Retrieve the authenticated client ID securely.
     */
    protected function getClientId(): int
    {
        $user = Auth::user();

        if (!$user || !$user->client_id) {
            abort(403, 'Unauthorized Client Portal Access');
        }

        return (int) $user->client_id;
    }

    /**
     * Retrieve client model with active currency.
     */
    protected function getClientModel(): Client
    {
        return Client::findOrFail($this->getClientId());
    }

    /**
     * Display a listing of Website Projects for the authenticated client.
     */
    public function index(Request $request): Response
    {
        $this->authorizePermission('view-client-portal-projects');

        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        $search = $request->query('search');
        $status = $request->query('status');

        $user = Auth::user();
        $employee = null;
        if ($user && ($user->type === 'employee' || $user->employee_id)) {
            $employee = $user->employee ?: Employee::where('user_id', $user->id)->first();
        }

        $projectsQuery = WebsiteProject::with([
            'category',
            'payments',
            'tasks' => function ($q) use ($user, $employee) {
                if ($user && $user->type === 'employee') {
                    $employeeId = $employee ? $employee->id : 0;
                    $q->where('assigned_employee_id', $employeeId);
                }
                $q->with('assignedEmployee');
            },
        ])
            ->where('client_id', $clientId);

        if ($user && $user->type === 'employee') {
            $employeeId = $employee ? $employee->id : 0;
            $projectsQuery->whereHas('tasks', function ($query) use ($employeeId) {
                $query->where('assigned_employee_id', $employeeId);
            });
        }

        $projects = $projectsQuery
            ->when($search, function ($query, $search) {
                $query->where('project_name', 'like', "%{$search}%");
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        $allProjectsQuery = WebsiteProject::with('payments')->where('client_id', $clientId);
        if ($user && $user->type === 'employee') {
            $employeeId = $employee ? $employee->id : 0;
            $allProjectsQuery->whereHas('tasks', function ($query) use ($employeeId) {
                $query->where('assigned_employee_id', $employeeId);
            });
        }
        $allProjects = $allProjectsQuery->get();

        $totalBudget = (float) $allProjects->sum('total_budget');
        $totalCollected = (float) $allProjects->sum(function ($proj) {
            return (float) $proj->payments->where('status', 'paid')->sum('amount');
        });
        $totalPending = (float) $allProjects->sum(function ($proj) {
            $budget = (float) $proj->total_budget;
            $collected = (float) $proj->payments->where('status', 'paid')->sum('amount');
            return max(0, $budget - $collected);
        });

        $stats = [
            'total' => $allProjects->count(),
            'in_progress' => $allProjects->where('status', 'in_progress')->count(),
            'on_hold' => $allProjects->where('status', 'on_hold')->count(),
            'completed' => $allProjects->where('status', 'completed')->count(),
            'total_budget' => $totalBudget,
            'total_collected' => $totalCollected,
            'total_pending' => $totalPending,
        ];

        return Inertia::render('client-portal/projects/index', [
            'client' => $client,
            'projects' => $projects,
            'stats' => $stats,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
            ],
        ]);
    }

    /**
     * Display the specified Website Project detail page.
     */
    public function show(WebsiteProject $project): Response
    {
        $this->authorizePermission('view-client-portal-projects');

        $clientId = $this->getClientId();

        if ($project->client_id !== $clientId) {
            abort(403, 'Unauthorized access to project');
        }

        $client = $this->getClientModel();

        $user = Auth::user();
        $employee = null;
        if ($user && ($user->type === 'employee' || $user->employee_id)) {
            $employee = $user->employee ?: Employee::where('user_id', $user->id)->first();
        }

        if ($user && $user->type === 'employee') {
            $employeeId = $employee ? $employee->id : 0;
            $hasAssignedTask = $project->tasks()->where('assigned_employee_id', $employeeId)->exists();
            if (!$hasAssignedTask) {
                abort(403, 'Unauthorized access: No tasks assigned to you on this project.');
            }
        }

        $project->load([
            'client',
            'category',
            'payments' => function ($q) {
                $q->with('invoice')->orderBy('created_at', 'desc');
            },
            'tasks' => function ($q) use ($user, $employee) {
                if ($user && $user->type === 'employee') {
                    $employeeId = $employee ? $employee->id : 0;
                    $q->where('assigned_employee_id', $employeeId);
                }
                $q->with('assignedEmployee:id,name,employee_code,avatar')->orderBy('due_date', 'asc');
            },
            'credentials' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
            'documents' => function ($q) {
                $q->orderBy('created_at', 'desc');
            },
        ]);

        $companySettings = [
            'name' => SystemSetting::get('company_name', 'Sapta Technologies'),
            'email' => SystemSetting::get('company_email', 'contact@saptatechnologies.com'),
            'phone' => SystemSetting::get('company_phone', '+92 300 1234567'),
            'address' => SystemSetting::get('company_address', 'Office #402, Software Technology Park, Lahore, Pakistan'),
            'tax_id' => SystemSetting::get('company_tax_id', 'NTN-892415-0'),
            'logo' => SystemSetting::get('company_logo', '/app-logo-icon.png'),
        ];

        $employees = Employee::select('id', 'name', 'employee_code', 'avatar')
            ->where('status', 'active')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('client-portal/projects/show', [
            'client' => $client,
            'project' => $project,
            'company' => $companySettings,
            'employees' => $employees,
        ]);
    }

    /**
     * Show form for creating a new Website Project for this client.
     */
    public function create(): Response
    {
        $this->authorizePermission('create-client-portal-projects');

        $client = $this->getClientModel();
        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();
        $categories = ProjectCategory::where('is_active', true)->select('id', 'name')->orderBy('name', 'asc')->get();

        return Inertia::render('client-portal/projects/create', [
            'client' => $client,
            'currencies' => $currencies,
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created Website Project for this client.
     */
    public function store(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-projects');

        $clientId = $this->getClientId();

        $client = $this->getClientModel();

        $validated = $request->validate([
            'project_name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:project_categories,id'],
            'total_budget' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:10'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
            'start_date' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['in_progress', 'on_hold', 'completed', 'cancelled'])],
            'progress_percentage' => ['required', 'integer', 'between:0,100'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $currency = $validated['currency'] ?? ($client->currency ?? 'USD');
        $rate = (!empty($validated['exchange_rate']) && $validated['exchange_rate'] > 0)
            ? (float) $validated['exchange_rate']
            : CurrencyService::getRate($currency);

        $validated['client_id'] = $clientId;
        $validated['currency'] = $currency;
        $validated['category_id'] = $request->filled('category_id') ? (int) $request->category_id : null;
        $validated['exchange_rate'] = $rate;
        $validated['total_budget_pkr'] = round((float) $validated['total_budget'] * $rate, 2);

        WebsiteProject::create($validated);

        return redirect()->route('client-portal.projects.index')->with('success', 'Project created successfully.');
    }

    /**
     * Show form for editing the specified Website Project.
     */
    public function edit(WebsiteProject $project): Response
    {
        $this->authorizePermission('edit-client-portal-projects');

        $clientId = $this->getClientId();

        if ($project->client_id !== $clientId) {
            abort(403, 'Unauthorized access to project');
        }

        $client = $this->getClientModel();
        $currencies = Currency::where('is_active', true)->select('code', 'name', 'symbol')->get();
        $categories = ProjectCategory::where('is_active', true)->select('id', 'name')->orderBy('name', 'asc')->get();

        return Inertia::render('client-portal/projects/edit', [
            'client' => $client,
            'project' => $project,
            'currencies' => $currencies,
            'categories' => $categories,
            'exchange_rates' => CurrencyService::getDefaultRates(),
        ]);
    }

    /**
     * Update the specified Website Project in storage.
     */
    public function update(Request $request, WebsiteProject $project): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-projects');

        $clientId = $this->getClientId();

        if ($project->client_id !== $clientId) {
            abort(403, 'Unauthorized access to project');
        }

        $client = $this->getClientModel();

        $validated = $request->validate([
            'project_name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'exists:project_categories,id'],
            'total_budget' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:10'],
            'exchange_rate' => ['nullable', 'numeric', 'min:0.0001'],
            'start_date' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date'],
            'status' => ['required', Rule::in(['in_progress', 'on_hold', 'completed', 'cancelled'])],
            'progress_percentage' => ['required', 'integer', 'between:0,100'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $currency = $validated['currency'] ?? ($project->currency ?? ($client->currency ?? 'USD'));
        $rate = (!empty($validated['exchange_rate']) && $validated['exchange_rate'] > 0)
            ? (float) $validated['exchange_rate']
            : CurrencyService::getRate($currency);

        $validated['currency'] = $currency;
        $validated['category_id'] = $request->filled('category_id') ? (int) $request->category_id : null;
        $validated['exchange_rate'] = $rate;
        $validated['total_budget_pkr'] = round((float) $validated['total_budget'] * $rate, 2);

        $project->update($validated);

        return redirect()->route('client-portal.projects.index')->with('success', 'Project details updated successfully.');
    }

    /**
     * Remove the specified Website Project from storage.
     */
    public function destroy(WebsiteProject $project): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-projects');

        $clientId = $this->getClientId();

        if ($project->client_id !== $clientId) {
            abort(403, 'Unauthorized access to project');
        }

        $project->delete();

        return redirect()->route('client-portal.projects.index')->with('success', 'Project deleted successfully.');
    }

    /*
    |--------------------------------------------------------------------------
    | Project Tasks CRUD Handlers
    |--------------------------------------------------------------------------
    */
    public function storeTask(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-project-tasks');

        $clientId = $this->getClientId();

        $validated = $request->validate([
            'website_project_id' => [
                'required',
                Rule::exists('website_projects', 'id')->where(function ($query) use ($clientId) {
                    return $query->where('client_id', $clientId);
                }),
            ],
            'assigned_employee_id' => 'nullable|exists:employees,id',
            'task_title' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'required|in:todo,in_progress,in_review,completed,cancelled',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'description' => 'nullable|string|max:2000',
        ]);

        $validated['assigned_employee_id'] = $request->filled('assigned_employee_id') ? $request->assigned_employee_id : null;
        $validated['start_date'] = $request->filled('start_date') ? $request->start_date : null;
        $validated['due_date'] = $request->filled('due_date') ? $request->due_date : null;

        if ($validated['status'] === 'completed') {
            $validated['completed_at'] = now();
        }

        ProjectTask::create($validated);

        return redirect()->back()->with('success', 'Project task created successfully.');
    }

    public function updateTask(Request $request, ProjectTask $task): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-project-tasks');

        $clientId = $this->getClientId();

        if (!$task->websiteProject || $task->websiteProject->client_id !== $clientId) {
            abort(403, 'Unauthorized access to task');
        }

        $validated = $request->validate([
            'website_project_id' => [
                'required',
                Rule::exists('website_projects', 'id')->where(function ($query) use ($clientId) {
                    return $query->where('client_id', $clientId);
                }),
            ],
            'assigned_employee_id' => 'nullable|exists:employees,id',
            'task_title' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'required|in:todo,in_progress,in_review,completed,cancelled',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'description' => 'nullable|string|max:2000',
        ]);

        $validated['assigned_employee_id'] = $request->filled('assigned_employee_id') ? $request->assigned_employee_id : null;
        $validated['start_date'] = $request->filled('start_date') ? $request->start_date : null;
        $validated['due_date'] = $request->filled('due_date') ? $request->due_date : null;

        if ($validated['status'] === 'completed' && $task->status !== 'completed') {
            $validated['completed_at'] = now();
        } elseif ($validated['status'] !== 'completed') {
            $validated['completed_at'] = null;
        }

        $task->update($validated);

        return redirect()->back()->with('success', 'Task updated successfully.');
    }

    public function updateStatus(Request $request, ProjectTask $task): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-project-tasks');

        $clientId = $this->getClientId();

        if (!$task->websiteProject || $task->websiteProject->client_id !== $clientId) {
            abort(403, 'Unauthorized access to task');
        }

        $validated = $request->validate([
            'status' => 'required|in:todo,in_progress,in_review,completed,cancelled',
        ]);

        $updateData = ['status' => $validated['status']];
        if ($validated['status'] === 'completed') {
            $updateData['completed_at'] = now();
        } else {
            $updateData['completed_at'] = null;
        }

        $task->update($updateData);

        return redirect()->back()->with('success', 'Task status updated.');
    }

    public function destroyTask(ProjectTask $task): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-project-tasks');

        $clientId = $this->getClientId();

        if (!$task->websiteProject || $task->websiteProject->client_id !== $clientId) {
            abort(403, 'Unauthorized access to task');
        }

        if ($task->status === 'completed') {
            return redirect()->back()->with('error', 'Completed tasks cannot be deleted to preserve accurate project progress calculations.');
        }

        $task->delete();

        return redirect()->back()->with('success', 'Task deleted successfully.');
    }

    /*
    |--------------------------------------------------------------------------
    | Project Milestones & Budget Handlers
    |--------------------------------------------------------------------------
    */
    public function storeMilestone(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-project-milestones');

        $clientId = $this->getClientId();

        $validated = $request->validate([
            'website_project_id' => [
                'required',
                Rule::exists('website_projects', 'id')->where(function ($query) use ($clientId) {
                    return $query->where('client_id', $clientId);
                }),
            ],
            'milestone_title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'payment_stage' => ['required', Rule::in(['advance', 'partial', 'full'])],
            'notes' => 'nullable|string|max:1000',
        ]);

        $project = WebsiteProject::where('id', $validated['website_project_id'])
            ->where('client_id', $clientId)
            ->firstOrFail();

        $currentSum = ProjectPayment::where('website_project_id', $project->id)->sum('amount');
        $remainingBudget = max(0, (float) $project->total_budget - (float) $currentSum);

        if ((float) $validated['amount'] > ($remainingBudget + 0.01)) {
            return redirect()->back()->withErrors([
                'amount' => "Milestone amount cannot exceed remaining unallocated project budget of {$project->currency} " . number_format($remainingBudget, 2),
            ]);
        }

        $validated['client_id'] = $clientId;
        $validated['status'] = 'pending';
        $validated['paid_at'] = null;

        $rate = CurrencyService::getRate($project->currency);
        $validated['exchange_rate'] = $rate;
        $validated['amount_pkr'] = round((float) $validated['amount'] * $rate, 2);

        ProjectPayment::create($validated);

        return redirect()->back()->with('success', 'Project milestone created successfully.');
    }

    public function updateMilestone(Request $request, ProjectPayment $milestone): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-project-milestones');

        $clientId = $this->getClientId();

        if ($milestone->client_id !== $clientId) {
            abort(403, 'Unauthorized access to milestone');
        }

        if ($milestone->invoice()->exists() || $milestone->status === 'paid') {
            return redirect()->back()->with('error', 'Milestone payments with a generated invoice or paid status cannot be edited.');
        }

        $validated = $request->validate([
            'website_project_id' => [
                'required',
                Rule::exists('website_projects', 'id')->where(function ($query) use ($clientId) {
                    return $query->where('client_id', $clientId);
                }),
            ],
            'milestone_title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'payment_stage' => ['required', Rule::in(['advance', 'partial', 'full'])],
            'notes' => 'nullable|string|max:1000',
        ]);

        $project = WebsiteProject::where('id', $validated['website_project_id'])
            ->where('client_id', $clientId)
            ->firstOrFail();

        $otherSum = ProjectPayment::where('website_project_id', $project->id)
            ->where('id', '!=', $milestone->id)
            ->sum('amount');
        $remainingBudget = max(0, (float) $project->total_budget - (float) $otherSum);

        if ((float) $validated['amount'] > ($remainingBudget + 0.01)) {
            return redirect()->back()->withErrors([
                'amount' => "Milestone amount cannot exceed remaining unallocated project budget of {$project->currency} " . number_format($remainingBudget, 2),
            ]);
        }

        $rate = CurrencyService::getRate($project->currency);
        $validated['exchange_rate'] = $rate;
        $validated['amount_pkr'] = round((float) $validated['amount'] * $rate, 2);

        $milestone->update($validated);

        if (($validated['status'] ?? $milestone->status) === 'paid') {
            Invoice::syncItemAndCheckInvoicePaid($milestone);
        }

        return redirect()->back()->with('success', 'Project milestone updated successfully.');
    }

    public function destroyMilestone(ProjectPayment $milestone): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-project-milestones');

        $clientId = $this->getClientId();

        if ($milestone->client_id !== $clientId) {
            abort(403, 'Unauthorized access to milestone');
        }

        if ($milestone->invoice()->exists() || $milestone->status === 'paid') {
            return redirect()->back()->with('error', 'Milestone payments with a generated invoice or paid status cannot be deleted.');
        }

        $milestone->delete();

        return redirect()->back()->with('success', 'Project milestone deleted successfully.');
    }

    public function generateMilestoneInvoice(ProjectPayment $milestone): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-invoices');

        $clientId = $this->getClientId();

        if ($milestone->client_id !== $clientId) {
            abort(403, 'Unauthorized access to milestone');
        }

        if ($milestone->invoice()->exists()) {
            return redirect()->back()->with('error', 'An invoice has already been generated for this milestone payment.');
        }

        $project = $milestone->websiteProject;
        $currency = $project ? ($project->currency ?? 'USD') : 'USD';
        $rate = CurrencyService::getRate($currency);

        $invoiceNumber = Invoice::generateNextInvoiceNumber();

        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'client_id' => $milestone->client_id,
            'currency_code' => $currency,
            'exchange_rate_to_pkr' => $rate,
            'subtotal' => $milestone->amount,
            'tax_rate' => 0.00,
            'tax_amount' => 0.00,
            'discount' => 0.00,
            'total_amount' => $milestone->amount,
            'total_amount_pkr' => round((float) $milestone->amount * $rate, 2),
            'issue_date' => now()->toDateString(),
            'due_date' => $milestone->paid_at ? $milestone->paid_at->toDateString() : now()->addDays(14)->toDateString(),
            'notes' => 'Invoice generated for project milestone: ' . $milestone->milestone_title,
            'created_by' => Auth::id(),
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'description' => 'Project Milestone: ' . $milestone->milestone_title . ($milestone->notes ? ' (' . $milestone->notes . ')' : ''),
            'quantity' => 1.00,
            'unit_price' => $milestone->amount,
            'amount' => $milestone->amount,
            'invoiceable_type' => ProjectPayment::class,
            'invoiceable_id' => $milestone->id,
        ]);

        return redirect()->back()->with('success', "Invoice {$invoiceNumber} generated successfully.");
    }

    public function markMilestoneAsPaid(ProjectPayment $milestone): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-project-milestones');

        $clientId = $this->getClientId();

        if ($milestone->client_id !== $clientId) {
            abort(403, 'Unauthorized access to milestone');
        }

        if (!$milestone->invoice()->exists()) {
            return redirect()->back()->with('error', 'Please generate an invoice before marking this milestone as paid.');
        }

        $milestone->update([
            'status' => 'paid',
            'paid_at' => $milestone->paid_at ?? now()->toDateString(),
        ]);

        Invoice::syncItemAndCheckInvoicePaid($milestone);

        return redirect()->back()->with('success', "Milestone '{$milestone->milestone_title}' marked as Paid successfully.");
    }

    /*
    |--------------------------------------------------------------------------
    | Project Credentials Handlers
    |--------------------------------------------------------------------------
    */
    public function storeCredential(Request $request): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-project-credentials');

        $clientId = $this->getClientId();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => ['required', Rule::in(['hosting', 'cms', 'database', 'domain', 'api', 'other'])],
            'website_project_id' => 'nullable|exists:website_projects,id',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:500',
            'url' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:2000',
        ]);

        $validated['client_id'] = $clientId;

        ClientCredential::create($validated);

        return redirect()->back()->with('success', 'Credential created successfully.');
    }

    public function updateCredential(Request $request, ClientCredential $credential): RedirectResponse
    {
        $this->authorizePermission('edit-client-portal-project-credentials');

        $clientId = $this->getClientId();

        if ($credential->client_id !== $clientId) {
            abort(403, 'Unauthorized access to credential');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => ['required', Rule::in(['hosting', 'cms', 'database', 'domain', 'api', 'other'])],
            'website_project_id' => 'nullable|exists:website_projects,id',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:500',
            'url' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:2000',
        ]);

        $credential->update($validated);

        return redirect()->back()->with('success', 'Credential updated successfully.');
    }

    public function destroyCredential(ClientCredential $credential): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-project-credentials');

        $clientId = $this->getClientId();

        if ($credential->client_id !== $clientId) {
            abort(403, 'Unauthorized access to credential');
        }

        $credential->delete();

        return redirect()->back()->with('success', 'Credential deleted successfully.');
    }

    public function storeDocument(Request $request, WebsiteProject $project): RedirectResponse
    {
        $this->authorizePermission('create-client-portal-project-documents');
        $clientId = $this->getClientId();

        if ($project->client_id !== $clientId) {
            abort(403, 'Unauthorized access to project');
        }

        $allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'png', 'jpg', 'jpeg', 'webp'];

        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'file' => [
                'required',
                'file',
                'max:25600',
                function ($attribute, $value, $fail) use ($allowedExtensions) {
                    if (!$value || !method_exists($value, 'getClientOriginalExtension'))
                        return;
                    $ext = strtolower($value->getClientOriginalExtension());
                    if (!in_array($ext, $allowedExtensions)) {
                        $fail('The file field must be a file of type: ' . implode(', ', $allowedExtensions) . '.');
                    }
                },
            ],
        ]);

        $file = $request->file('file');
        $originalName = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());
        $fileSize = $file->getSize();

        $destinationPath = public_path('uploads/documents');
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }

        $filename = time() . '_' . uniqid() . '.' . $extension;
        $file->move($destinationPath, $filename);
        $filePath = '/uploads/documents/' . $filename;

        \App\Models\ClientDocument::create([
            'client_id' => $clientId,
            'website_project_id' => $project->id,
            'title' => $request->input('title'),
            'file_path' => $filePath,
            'file_name' => $originalName,
            'file_type' => $extension,
            'file_size' => $fileSize,
        ]);

        return redirect()->back()->with('success', 'Document uploaded successfully.');
    }

    public function destroyDocument(WebsiteProject $project, \App\Models\ClientDocument $document): RedirectResponse
    {
        $this->authorizePermission('delete-client-portal-project-documents');
        $clientId = $this->getClientId();

        if ($project->client_id !== $clientId || $document->website_project_id !== $project->id) {
            abort(403, 'Unauthorized access');
        }

        $physicalPath = public_path($document->file_path);
        if (file_exists($physicalPath)) {
            @unlink($physicalPath);
        }
        $document->delete();

        return redirect()->back()->with('success', 'Document deleted successfully.');
    }
}
