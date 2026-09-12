<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientService;
use App\Models\ServiceCategory;
use App\Models\ServiceTask;
use App\Services\TaskNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    /**
     * Display a listing of Client Services across clients (Read-Only).
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-services') && !$user->can('view-services'))) {
            abort(403, 'Unauthorized. You do not have permission to view services.');
        }

        $search = $request->query('search');
        $status = $request->query('status');
        $clientId = $request->query('client_id');
        $categoryId = $request->query('category_id');
        $billingCycle = $request->query('billing_cycle');

        $query = ClientService::with([
            'client:id,name,company_name,client_code,email,status',
            'category:id,name',
        ])
        ->withCount('tasks')
        ->when($search, function ($q, $search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('service_name', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('client', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                           ->orWhere('client_code', 'like', "%{$search}%")
                           ->orWhere('company_name', 'like', "%{$search}%");
                    });
            });
        })
        ->when($status, function ($q, $status) {
            $q->where('status', $status);
        })
        ->when($clientId, function ($q, $clientId) {
            $q->where('client_id', $clientId);
        })
        ->when($categoryId, function ($q, $categoryId) {
            $q->where('category_id', $categoryId);
        })
        ->when($billingCycle, function ($q, $billingCycle) {
            $q->where('billing_cycle', $billingCycle);
        });

        $services = $query->latest('id')
            ->paginate(12)
            ->withQueryString()
            ->through(function ($srv) {
                return [
                    'id' => $srv->id,
                    'client_id' => $srv->client_id,
                    'service_name' => $srv->service_name,
                    'category' => $srv->category ? [
                        'id' => $srv->category->id,
                        'name' => $srv->category->name,
                    ] : null,
                    'client' => $srv->client ? [
                        'id' => $srv->client->id,
                        'name' => $srv->client->name,
                        'company_name' => $srv->client->company_name,
                        'client_code' => $srv->client->client_code,
                    ] : null,
                    'billing_cycle' => $srv->billing_cycle,
                    'start_date' => $srv->start_date ? $srv->start_date->format('d M Y') : null,
                    'next_renewal_date' => $srv->next_renewal_date ? $srv->next_renewal_date->format('d M Y') : null,
                    'status' => $srv->status,
                    'tasks_count' => $srv->tasks_count ?? 0,
                    'created_at' => $srv->created_at ? $srv->created_at->format('d M Y') : null,
                ];
            });

        // Operational stats (strictly non-financial)
        $stats = [
            'total' => ClientService::count(),
            'active' => ClientService::where('status', 'active')->count(),
            'suspended' => ClientService::where('status', 'suspended')->count(),
            'cancelled' => ClientService::where('status', 'cancelled')->count(),
            'completed' => ClientService::where('status', 'completed')->count(),
        ];

        $clients = Client::select('id', 'name', 'client_code', 'company_name')->orderBy('name')->get();
        $categories = ServiceCategory::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('services/index', [
            'services' => $services,
            'stats' => $stats,
            'clients' => $clients,
            'categories' => $categories,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'client_id' => $clientId ?? '',
                'category_id' => $categoryId ?? '',
                'billing_cycle' => $billingCycle ?? '',
            ],
        ]);
    }

    /**
     * Display the specified Client Service details with tabbed workspace (Read-Only).
     */
    public function show(ClientService $service): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-services') && !$user->can('view-services'))) {
            abort(403, 'Unauthorized. You do not have permission to view services.');
        }

        $isSuperAdmin = $user->hasRole('Super Admin');

        // Check granular tab permissions
        $canViewTasks = $isSuperAdmin || $user->hasPermissionTo('view-service-tasks') || $user->can('view-service-tasks');
        $canViewCredentials = $isSuperAdmin || $user->hasPermissionTo('view-service-credentials') || $user->can('view-service-credentials');
        $canViewDocuments = $isSuperAdmin || $user->hasPermissionTo('view-service-documents') || $user->can('view-service-documents');

        $service->load([
            'client:id,name,company_name,client_code,email,phone,city,country,status',
            'category:id,name',
        ]);

        if ($canViewTasks) {
            $service->load([
                'tasks' => function ($q) {
                    $q->with('assignedEmployee:id,name,employee_code,avatar')
                      ->withCount('messages')
                      ->orderBy('due_date', 'asc');
                },
            ]);
        }

        if ($canViewCredentials) {
            $service->load([
                'credentials' => function ($q) {
                    $q->orderBy('created_at', 'desc');
                },
            ]);
        }

        if ($canViewDocuments) {
            $service->load([
                'documents' => function ($q) {
                    $q->orderBy('created_at', 'desc');
                },
            ]);
        }

        // Format service data safely without financial figures
        $serviceData = [
            'id' => $service->id,
            'client_id' => $service->client_id,
            'service_name' => $service->service_name,
            'category' => $service->category,
            'client' => $service->client,
            'billing_cycle' => $service->billing_cycle,
            'start_date' => $service->start_date ? $service->start_date->format('d M Y') : null,
            'next_renewal_date' => $service->next_renewal_date ? $service->next_renewal_date->format('d M Y') : null,
            'status' => $service->status,
            'notes' => $service->notes,
            'created_at' => $service->created_at ? $service->created_at->format('d M Y') : null,
            'tasks' => $canViewTasks ? ($service->tasks->map(function ($t) {
                return [
                    'id' => $t->id,
                    'task_title' => $t->task_title,
                    'task_description' => $t->task_description,
                    'priority' => $t->priority,
                    'status' => $t->status,
                    'start_date' => $t->start_date ? $t->start_date->format('d M Y') : null,
                    'due_date' => $t->due_date ? $t->due_date->format('d M Y') : null,
                    'assigned_employee' => $t->assignedEmployee,
                    'messages_count' => $t->messages_count ?? 0,
                ];
            })) : [],
            'credentials' => $canViewCredentials ? $service->credentials : [],
            'documents' => $canViewDocuments ? ($service->documents->map(function ($d) {
                return [
                    'id' => $d->id,
                    'title' => $d->title,
                    'file_path' => $d->file_path,
                    'file_name' => $d->file_name,
                    'file_type' => $d->file_type,
                    'file_size' => $d->file_size,
                    'created_at' => $d->created_at ? $d->created_at->format('d M Y, h:i A') : null,
                    'updated_at' => $d->updated_at ? $d->updated_at->format('d M Y, h:i A') : null,
                ];
            })) : [],
        ];

        return Inertia::render('services/show', [
            'service' => $serviceData,
            'permissions' => [
                'view_tasks' => $canViewTasks,
                'view_credentials' => $canViewCredentials,
                'view_documents' => $canViewDocuments,
            ],
        ]);
    }

    /**
     * Display dedicated service task conversation and details page within Admin Portal hierarchy.
     */
    public function taskConversation(Request $request, ClientService $service, ServiceTask $task): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-services') && !$user->can('view-services') && !$user->hasRole('admin') && $user->type !== 'admin')) {
            abort(403, 'Unauthorized. You do not have permission to view services.');
        }

        if ($task->client_service_id !== $service->id) {
            abort(404, 'Task not found on this service');
        }

        $task->load([
            'assignedEmployee:id,name,employee_code,avatar,email,designation_id,department_id',
            'assignedEmployee.designation:id,name',
            'assignedEmployee.department:id,name',
            'messages' => function ($q) {
                $q->with('user:id,name,email,avatar,type,employee_id')->orderBy('created_at', 'asc');
            },
        ]);

        $service->load([
            'client:id,name,company_name,client_code,currency,status',
            'category:id,name',
        ]);

        $taskData = [
            'id' => $task->id,
            'task_title' => $task->task_title,
            'priority' => $task->priority,
            'status' => $task->status,
            'start_date' => $task->start_date ? $task->start_date->toDateString() : null,
            'due_date' => $task->due_date ? $task->due_date->toDateString() : null,
            'completed_at' => $task->completed_at ? $task->completed_at->toISOString() : null,
            'created_at' => $task->created_at ? $task->created_at->toISOString() : null,
            'description' => $task->description ?? $task->task_description,
            'attachment' => $task->attachment,
            'attachment_name' => $task->attachment_name,
            'source_type' => 'service',
            'source_id' => $service->id,
            'source_title' => $service->service_name,
            'source_code' => $service->service_code ?? 'SRV-' . str_pad((string) $service->id, 4, '0', STR_PAD_LEFT),
            'source_url' => "/services/{$service->id}?tab=tasks",
            'from' => "/services/{$service->id}?tab=tasks",
            'assigned_employee' => $task->assignedEmployee ? [
                'id' => $task->assignedEmployee->id,
                'name' => $task->assignedEmployee->name,
                'employee_code' => $task->assignedEmployee->employee_code,
                'avatar' => $task->assignedEmployee->avatar,
                'email' => $task->assignedEmployee->email ?? null,
                'designation' => $task->assignedEmployee->designation?->name,
                'department' => $task->assignedEmployee->department?->name,
            ] : null,
            'messages' => $task->messages,
        ];

        return Inertia::render('services/task-conversation', [
            'service' => [
                'id' => $service->id,
                'service_name' => $service->service_name,
                'service_code' => $service->service_code ?? 'SRV-' . str_pad((string) $service->id, 4, '0', STR_PAD_LEFT),
                'status' => $service->status,
                'client' => $service->client,
                'category' => $service->category,
            ],
            'task' => $taskData,
        ]);
    }

    /**
     * Update service task status from the admin task conversation view.
     */
    public function updateTaskStatus(Request $request, ServiceTask $task): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('edit-services') && !$user->can('edit-services') && !$user->hasRole('admin') && $user->type !== 'admin')) {
            abort(403, 'Unauthorized to update task status.');
        }

        $validated = $request->validate([
            'status' => 'required|in:todo,in_progress,in_review,completed,cancelled',
        ]);

        $updateData = ['status' => $validated['status']];
        if ($validated['status'] === 'completed' && $task->status !== 'completed') {
            $updateData['completed_at'] = now();
        } elseif ($validated['status'] !== 'completed') {
            $updateData['completed_at'] = null;
        }

        $oldStatus = $task->status;
        $task->update($updateData);

        if ($oldStatus !== $validated['status'] && $task->assigned_employee_id) {
            TaskNotificationService::notifyTaskUpdated($task, 'service', ['status' => $validated['status']]);
        }

        return redirect()->back()->with('success', 'Task status updated successfully.');
    }
}
