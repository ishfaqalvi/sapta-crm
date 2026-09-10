<?php

namespace App\Http\Controllers;

use App\Models\ClientService;
use App\Models\Employee;
use App\Models\ProjectTask;
use App\Models\ServiceTask;
use App\Models\Task;
use App\Models\WebsiteProject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MyTaskController extends Controller
{
    /**
     * Display a listing of assigned project, service, and general tasks for the authenticated employee.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        // Resolve employee record linked to the user
        $employee = null;
        if ($user->type === 'employee' || $user->employee_id) {
            $employee = $user->employee ?: Employee::where('user_id', $user->id)->first();
        }

        $employeeId = ($user->type === 'employee')
            ? ($employee ? $employee->id : 0)
            : ($request->filled('employee_id') ? (int) $request->query('employee_id') : null);

        $search = $request->query('search');
        $status = $request->query('status');
        $priority = $request->query('priority');
        $sourceType = $request->query('source_type', '');
        $projectId = $request->query('project_id');
        $serviceId = $request->query('service_id');

        // 1. Project Tasks Query
        $projectQuery = ProjectTask::withCount('messages')->with([
            'websiteProject.client:id,name,company_name,client_code,currency',
            'websiteProject.category:id,name',
            'assignedEmployee:id,name,employee_code,avatar',
        ]);

        if (!is_null($employeeId)) {
            $projectQuery->where('assigned_employee_id', $employeeId);
        }

        if ($search) {
            $projectQuery->where(function ($q) use ($search) {
                $q->where('task_title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('websiteProject', function ($pq) use ($search) {
                        $pq->where('project_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('websiteProject.client', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status) {
            $projectQuery->where('status', $status);
        }
        if ($priority) {
            $projectQuery->where('priority', $priority);
        }
        if ($projectId) {
            $projectQuery->where('website_project_id', $projectId);
        }

        // 2. Service Tasks Query
        $serviceQuery = ServiceTask::withCount('messages')->with([
            'service.client:id,name,company_name,client_code,currency',
            'service.category:id,name',
            'assignedEmployee:id,name,employee_code,avatar',
        ]);

        if (!is_null($employeeId)) {
            $serviceQuery->where('assigned_employee_id', $employeeId);
        }

        if ($search) {
            $serviceQuery->where(function ($q) use ($search) {
                $q->where('task_title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('service', function ($sq) use ($search) {
                        $sq->where('service_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('service.client', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                            ->orWhere('company_name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status) {
            $serviceQuery->where('status', $status);
        }
        if ($priority) {
            $serviceQuery->where('priority', $priority);
        }
        if ($serviceId) {
            $serviceQuery->where('client_service_id', $serviceId);
        }

        // 3. General Tasks Query
        $generalQuery = Task::withCount('messages')->with([
            'taskCategory:id,name',
            'assignedEmployee:id,name,employee_code,avatar',
        ]);

        if (!is_null($employeeId)) {
            $generalQuery->where('assigned_employee_id', $employeeId);
        }

        if ($search) {
            $generalQuery->where(function ($q) use ($search) {
                $q->where('task_title', 'like', "%{$search}%")
                    ->orWhere('task_code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('taskCategory', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($status) {
            $generalQuery->where('status', $status);
        }
        if ($priority) {
            $generalQuery->where('priority', $priority);
        }

        // Stats Base Queries
        $baseProjectStats = ProjectTask::query();
        $baseServiceStats = ServiceTask::query();
        $baseGeneralStats = Task::query();

        if (!is_null($employeeId)) {
            $baseProjectStats->where('assigned_employee_id', $employeeId);
            $baseServiceStats->where('assigned_employee_id', $employeeId);
            $baseGeneralStats->where('assigned_employee_id', $employeeId);
        }

        $totalCount = (clone $baseProjectStats)->count() + (clone $baseServiceStats)->count() + (clone $baseGeneralStats)->count();
        $todoCount = (clone $baseProjectStats)->where('status', 'todo')->count() + (clone $baseServiceStats)->where('status', 'todo')->count() + (clone $baseGeneralStats)->where('status', 'todo')->count();
        $inProgressCount = (clone $baseProjectStats)->where('status', 'in_progress')->count() + (clone $baseServiceStats)->where('status', 'in_progress')->count() + (clone $baseGeneralStats)->where('status', 'in_progress')->count();
        $inReviewCount = (clone $baseProjectStats)->where('status', 'in_review')->count() + (clone $baseServiceStats)->where('status', 'in_review')->count() + (clone $baseGeneralStats)->where('status', 'in_review')->count();
        $completedCount = (clone $baseProjectStats)->where('status', 'completed')->count() + (clone $baseServiceStats)->where('status', 'completed')->count() + (clone $baseGeneralStats)->where('status', 'completed')->count();
        $urgentCount = (clone $baseProjectStats)->where('priority', 'urgent')->where('status', '!=', 'completed')->count()
            + (clone $baseServiceStats)->where('priority', 'urgent')->where('status', '!=', 'completed')->count()
            + (clone $baseGeneralStats)->where('priority', 'urgent')->where('status', '!=', 'completed')->count();

        $stats = [
            'total' => $totalCount,
            'todo' => $todoCount,
            'in_progress' => $inProgressCount,
            'in_review' => $inReviewCount,
            'completed' => $completedCount,
            'urgent' => $urgentCount,
        ];

        // Fetch tasks according to sourceType filter
        $allTasks = collect();

        if ($sourceType !== 'service' && $sourceType !== 'general' && !$serviceId) {
            $projectTasks = $projectQuery->get()->map(function ($t) {
                return [
                    'id' => $t->id,
                    'source_type' => 'project',
                    'task_title' => $t->task_title,
                    'priority' => $t->priority,
                    'status' => $t->status,
                    'start_date' => $t->start_date ? $t->start_date->toDateString() : null,
                    'due_date' => $t->due_date ? $t->due_date->toDateString() : null,
                    'description' => $t->description,
                    'attachment' => $t->attachment,
                    'attachment_name' => $t->attachment_name,
                    'completed_at' => $t->completed_at ? $t->completed_at->toISOString() : null,
                    'created_at' => $t->created_at ? $t->created_at->toISOString() : null,
                    'messages_count' => $t->messages_count ?? 0,
                    'website_project_id' => $t->website_project_id,
                    'website_project' => $t->websiteProject ? [
                        'id' => $t->websiteProject->id,
                        'project_name' => $t->websiteProject->project_name,
                        'total_budget' => $t->websiteProject->total_budget,
                        'currency' => $t->websiteProject->currency,
                        'total_budget_pkr' => $t->websiteProject->total_budget_pkr,
                        'start_date' => $t->websiteProject->start_date ? $t->websiteProject->start_date->toDateString() : null,
                        'deadline' => $t->websiteProject->deadline ? $t->websiteProject->deadline->toDateString() : null,
                        'status' => $t->websiteProject->status,
                        'progress_percentage' => $t->websiteProject->progress_percentage,
                        'notes' => $t->websiteProject->notes,
                        'client' => $t->websiteProject->client,
                        'category' => $t->websiteProject->category,
                    ] : null,
                    'assigned_employee' => $t->assignedEmployee,
                ];
            });
            $allTasks = $allTasks->concat($projectTasks);
        }

        if ($sourceType !== 'project' && $sourceType !== 'general' && !$projectId) {
            $serviceTasks = $serviceQuery->get()->map(function ($t) {
                return [
                    'id' => $t->id,
                    'source_type' => 'service',
                    'task_title' => $t->task_title,
                    'priority' => $t->priority,
                    'status' => $t->status,
                    'start_date' => $t->start_date ? $t->start_date->toDateString() : null,
                    'due_date' => $t->due_date ? $t->due_date->toDateString() : null,
                    'description' => $t->description,
                    'attachment' => $t->attachment,
                    'attachment_name' => $t->attachment_name,
                    'completed_at' => $t->completed_at ? $t->completed_at->toISOString() : null,
                    'created_at' => $t->created_at ? $t->created_at->toISOString() : null,
                    'messages_count' => $t->messages_count ?? 0,
                    'client_service_id' => $t->client_service_id,
                    'service' => $t->service ? [
                        'id' => $t->service->id,
                        'service_name' => $t->service->service_name,
                        'monthly_fee' => $t->service->monthly_fee,
                        'contract_months' => $t->service->contract_months,
                        'currency' => $t->service->currency,
                        'monthly_fee_pkr' => $t->service->monthly_fee_pkr,
                        'billing_day' => $t->service->billing_day,
                        'start_date' => $t->service->start_date ? $t->service->start_date->toDateString() : null,
                        'status' => $t->service->status,
                        'notes' => $t->service->notes,
                        'client' => $t->service->client,
                        'category' => $t->service->category,
                    ] : null,
                    'assigned_employee' => $t->assignedEmployee,
                ];
            });
            $allTasks = $allTasks->concat($serviceTasks);
        }

        if ($sourceType !== 'project' && $sourceType !== 'service' && !$projectId && !$serviceId) {
            $generalTasks = $generalQuery->get()->map(function ($t) {
                return [
                    'id' => $t->id,
                    'source_type' => 'general',
                    'task_code' => $t->task_code,
                    'task_title' => $t->task_title,
                    'priority' => $t->priority,
                    'status' => $t->status,
                    'start_date' => $t->start_date ? $t->start_date->toDateString() : null,
                    'due_date' => $t->due_date ? $t->due_date->toDateString() : null,
                    'description' => $t->description,
                    'attachment' => $t->attachment,
                    'attachment_name' => $t->attachment_name,
                    'completed_at' => $t->completed_at ? $t->completed_at->toISOString() : null,
                    'created_at' => $t->created_at ? $t->created_at->toISOString() : null,
                    'messages_count' => $t->messages_count ?? 0,
                    'task_category' => $t->taskCategory ? [
                        'id' => $t->taskCategory->id,
                        'name' => $t->taskCategory->name,
                    ] : null,
                    'assigned_employee' => $t->assignedEmployee,
                ];
            });
            $allTasks = $allTasks->concat($generalTasks);
        }

        // Sort: incomplete first, then due_date asc, then created_at desc
        $sortedTasks = $allTasks->sort(function ($a, $b) {
            $aCompleted = ($a['status'] === 'completed') ? 1 : 0;
            $bCompleted = ($b['status'] === 'completed') ? 1 : 0;
            if ($aCompleted !== $bCompleted) {
                return $aCompleted <=> $bCompleted;
            }
            $aDue = $a['due_date'] ?? '9999-12-31';
            $bDue = $b['due_date'] ?? '9999-12-31';
            if ($aDue !== $bDue) {
                return strcmp($aDue, $bDue);
            }
            return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
        })->values();

        // Paginate collection manually
        $perPage = 15;
        $currentPage = (int) $request->query('page', 1);
        if ($currentPage < 1) $currentPage = 1;
        $totalItems = $sortedTasks->count();
        $pagedItems = $sortedTasks->slice(($currentPage - 1) * $perPage, $perPage)->values();

        $paginated = new LengthAwarePaginator(
            $pagedItems,
            $totalItems,
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        $projects = WebsiteProject::select('id', 'project_name')->orderBy('project_name', 'asc')->get();
        $services = ClientService::select('id', 'service_name')->orderBy('service_name', 'asc')->get();

        return Inertia::render('my-tasks/index', [
            'tasks' => $paginated,
            'stats' => $stats,
            'projects' => $projects,
            'services' => $services,
            'employee' => $employee,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'priority' => $priority ?? '',
                'source_type' => $sourceType ?? '',
                'project_id' => $projectId ?? '',
                'service_id' => $serviceId ?? '',
            ],
        ]);
    }

    /**
     * Update status of an assigned project task.
     */
    public function updateStatus(Request $request, ProjectTask $task): RedirectResponse
    {
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        if ($user->type === 'employee') {
            $employee = $user->employee ?: Employee::where('user_id', $user->id)->first();
            if (!$employee || $task->assigned_employee_id !== $employee->id) {
                abort(403, 'Unauthorized. You can only update your own assigned tasks.');
            }
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

        $task->update($updateData);

        return redirect()->back()->with('success', 'Task status updated successfully.');
    }

    /**
     * Update status of an assigned service task.
     */
    public function updateServiceTaskStatus(Request $request, ServiceTask $task): RedirectResponse
    {
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        if ($user->type === 'employee') {
            $employee = $user->employee ?: Employee::where('user_id', $user->id)->first();
            if (!$employee || $task->assigned_employee_id !== $employee->id) {
                abort(403, 'Unauthorized. You can only update your own assigned tasks.');
            }
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

        $task->update($updateData);

        return redirect()->back()->with('success', 'Service task status updated successfully.');
    }

    /**
     * Update status of an assigned general task.
     */
    public function updateGeneralTaskStatus(Request $request, Task $task): RedirectResponse
    {
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        if ($user->type === 'employee') {
            $employee = $user->employee ?: Employee::where('user_id', $user->id)->first();
            if (!$employee || $task->assigned_employee_id !== $employee->id) {
                abort(403, 'Unauthorized. You can only update your own assigned tasks.');
            }
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

        $task->update($updateData);

        return redirect()->back()->with('success', 'General task status updated successfully.');
    }

    /**
     * Display dedicated task conversation and discussion page for an assigned task in Employee Portal.
     */
    public function taskConversation(Request $request, string $type, int $id): Response
    {
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $isSuperAdmin = ($user->type === 'admin' || $user->hasRole('Super Admin') || $user->hasRole('admin'));

        // Resolve employee record linked to user
        $employee = null;
        if ($user->type === 'employee' || $user->employee_id) {
            $employee = $user->employee ?: Employee::where('user_id', $user->id)->first();
        }
        $employeeId = $employee ? $employee->id : 0;

        $task = null;
        $sourceInfo = null;
        $clientData = null;

        if ($type === 'project') {
            $task = ProjectTask::with([
                'websiteProject.client:id,name,company_name,client_code,currency',
                'websiteProject.category:id,name',
                'assignedEmployee:id,name,employee_code,avatar,email,designation_id,department_id',
                'assignedEmployee.designation:id,name',
                'assignedEmployee.department:id,name',
                'messages' => function ($q) {
                    $q->with('user:id,name,email,avatar,type,employee_id')->orderBy('created_at', 'asc');
                },
            ])->find($id);

            if (!$task) {
                abort(404, 'Project task not found');
            }

            if ($user->type === 'employee' && !$isSuperAdmin && $task->assigned_employee_id !== $employeeId) {
                abort(403, 'Unauthorized access: this task is not assigned to you.');
            }

            $project = $task->websiteProject;
            if ($project) {
                $sourceInfo = [
                    'id' => $project->id,
                    'title' => $project->project_name,
                    'code' => $project->project_code ?? 'PRJ-' . str_pad((string) $project->id, 4, '0', STR_PAD_LEFT),
                    'status' => $project->status,
                    'url' => "/projects/{$project->id}?tab=tasks",
                ];
                if ($project->client) {
                    $clientData = [
                        'id' => $project->client->id,
                        'name' => $project->client->name,
                        'company_name' => $project->client->company_name,
                        'client_code' => $project->client->client_code,
                        'currency' => $project->client->currency ?? 'USD',
                    ];
                }
            }
        } elseif ($type === 'service') {
            $task = ServiceTask::with([
                'service.client:id,name,company_name,client_code,currency',
                'service.category:id,name',
                'assignedEmployee:id,name,employee_code,avatar,email,designation_id,department_id',
                'assignedEmployee.designation:id,name',
                'assignedEmployee.department:id,name',
                'messages' => function ($q) {
                    $q->with('user:id,name,email,avatar,type,employee_id')->orderBy('created_at', 'asc');
                },
            ])->find($id);

            if (!$task) {
                abort(404, 'Service task not found');
            }

            if ($user->type === 'employee' && !$isSuperAdmin && $task->assigned_employee_id !== $employeeId) {
                abort(403, 'Unauthorized access: this task is not assigned to you.');
            }

            $service = $task->service;
            if ($service) {
                $sourceInfo = [
                    'id' => $service->id,
                    'title' => $service->service_name,
                    'code' => $service->service_code ?? 'SRV-' . str_pad((string) $service->id, 4, '0', STR_PAD_LEFT),
                    'status' => $service->status,
                    'url' => "/services/{$service->id}?tab=tasks",
                ];
                if ($service->client) {
                    $clientData = [
                        'id' => $service->client->id,
                        'name' => $service->client->name,
                        'company_name' => $service->client->company_name,
                        'client_code' => $service->client->client_code,
                        'currency' => $service->client->currency ?? 'USD',
                    ];
                }
            }
        } elseif ($type === 'general') {
            $task = Task::with([
                'taskCategory:id,name',
                'assignedEmployee:id,name,employee_code,avatar,email,designation_id,department_id',
                'assignedEmployee.designation:id,name',
                'assignedEmployee.department:id,name',
                'messages' => function ($q) {
                    $q->with('user:id,name,email,avatar,type,employee_id')->orderBy('created_at', 'asc');
                },
            ])->find($id);

            if (!$task) {
                abort(404, 'General task not found');
            }

            if ($user->type === 'employee' && !$isSuperAdmin && $task->assigned_employee_id !== $employeeId) {
                abort(403, 'Unauthorized access: this task is not assigned to you.');
            }

            $sourceInfo = [
                'id' => $task->id,
                'title' => $task->taskCategory ? $task->taskCategory->name : 'General Task',
                'code' => 'GEN-' . str_pad((string) $task->id, 4, '0', STR_PAD_LEFT),
                'status' => $task->status,
                'url' => '/tasks',
            ];
        } else {
            abort(404, 'Invalid task type');
        }

        $from = $request->query('from');
        if (!$from || !str_starts_with($from, '/') || str_starts_with($from, '//')) {
            $from = '/my-tasks';
        }

        $taskData = [
            'id' => $task->id,
            'task_title' => $task->task_title,
            'priority' => $task->priority,
            'status' => $task->status,
            'start_date' => $task->start_date ? $task->start_date->toDateString() : null,
            'due_date' => $task->due_date ? $task->due_date->toDateString() : null,
            'completed_at' => $task->completed_at ? $task->completed_at->toISOString() : null,
            'created_at' => $task->created_at ? $task->created_at->toISOString() : null,
            'description' => $task->description,
            'attachment' => $task->attachment,
            'attachment_name' => $task->attachment_name,
            'source_type' => $type,
            'source_id' => $sourceInfo['id'] ?? null,
            'source_title' => $sourceInfo['title'] ?? 'Task',
            'source_code' => $sourceInfo['code'] ?? null,
            'source_url' => $sourceInfo['url'] ?? null,
            'from' => $from,
            'client' => $clientData,
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

        return Inertia::render('my-tasks/task-conversation', [
            'task' => $taskData,
            'sourceInfo' => $sourceInfo,
            'client' => $clientData,
            'from' => $from,
        ]);
    }
}
