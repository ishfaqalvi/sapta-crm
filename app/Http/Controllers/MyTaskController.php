<?php

namespace App\Http\Controllers;

use App\Models\ClientService;
use App\Models\Employee;
use App\Models\ProjectTask;
use App\Models\ServiceTask;
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
     * Display a listing of assigned project and service tasks for the authenticated employee.
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
        $projectQuery = ProjectTask::with([
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
        $serviceQuery = ServiceTask::with([
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

        // Stats Base Queries
        $baseProjectStats = ProjectTask::query();
        $baseServiceStats = ServiceTask::query();
        if (!is_null($employeeId)) {
            $baseProjectStats->where('assigned_employee_id', $employeeId);
            $baseServiceStats->where('assigned_employee_id', $employeeId);
        }

        $totalCount = (clone $baseProjectStats)->count() + (clone $baseServiceStats)->count();
        $todoCount = (clone $baseProjectStats)->where('status', 'todo')->count() + (clone $baseServiceStats)->where('status', 'todo')->count();
        $inProgressCount = (clone $baseProjectStats)->where('status', 'in_progress')->count() + (clone $baseServiceStats)->where('status', 'in_progress')->count();
        $inReviewCount = (clone $baseProjectStats)->where('status', 'in_review')->count() + (clone $baseServiceStats)->where('status', 'in_review')->count();
        $completedCount = (clone $baseProjectStats)->where('status', 'completed')->count() + (clone $baseServiceStats)->where('status', 'completed')->count();
        $urgentCount = (clone $baseProjectStats)->where('priority', 'urgent')->where('status', '!=', 'completed')->count()
            + (clone $baseServiceStats)->where('priority', 'urgent')->where('status', '!=', 'completed')->count();

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

        if ($sourceType !== 'service') {
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
                    'completed_at' => $t->completed_at ? $t->completed_at->toISOString() : null,
                    'created_at' => $t->created_at ? $t->created_at->toISOString() : null,
                    'website_project_id' => $t->website_project_id,
                    'website_project' => $t->websiteProject ? [
                        'id' => $t->websiteProject->id,
                        'project_name' => $t->websiteProject->project_name,
                        'client' => $t->websiteProject->client,
                        'category' => $t->websiteProject->category,
                    ] : null,
                    'assigned_employee' => $t->assignedEmployee,
                ];
            });
            $allTasks = $allTasks->concat($projectTasks);
        }

        if ($sourceType !== 'project' && !$projectId) {
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
                    'completed_at' => $t->completed_at ? $t->completed_at->toISOString() : null,
                    'created_at' => $t->created_at ? $t->created_at->toISOString() : null,
                    'client_service_id' => $t->client_service_id,
                    'service' => $t->service ? [
                        'id' => $t->service->id,
                        'service_name' => $t->service->service_name,
                        'client' => $t->service->client,
                        'category' => $t->service->category,
                    ] : null,
                    'assigned_employee' => $t->assignedEmployee,
                ];
            });
            $allTasks = $allTasks->concat($serviceTasks);
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
}
