<?php

namespace App\Http\Controllers\ClientPortal;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Employee;
use App\Models\ProjectTask;
use App\Models\WebsiteProject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
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
     * Retrieve client model securely.
     */
    protected function getClientModel(): Client
    {
        return Client::findOrFail($this->getClientId());
    }

    /**
     * Display a listing of Website Project Tasks for the authenticated client.
     */
    public function index(Request $request): Response
    {
        $clientId = $this->getClientId();
        $client = $this->getClientModel();

        // Get all project IDs belonging to this client
        $projectIds = WebsiteProject::where('client_id', $clientId)->pluck('id')->toArray();

        $query = ProjectTask::whereIn('website_project_id', $projectIds)
            ->with([
                'websiteProject:id,project_name,client_id,status,progress_percentage,start_date,deadline,notes,total_budget,currency,exchange_rate,total_budget_pkr',
                'assignedEmployee:id,name,employee_code,avatar',
            ]);

        // Filter by Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('task_title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('websiteProject', function ($pq) use ($search) {
                        $pq->where('project_name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('assignedEmployee', function ($eq) use ($search) {
                        $eq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by Status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by Priority
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        // Filter by Website Project
        if ($request->filled('project_id')) {
            $query->where('website_project_id', $request->project_id);
        }

        $tasks = $query->orderBy('due_date', 'asc')
            ->orderBy('id', 'desc')
            ->paginate(10)
            ->withQueryString();

        $projects = WebsiteProject::where('client_id', $clientId)
            ->select('id', 'project_name')
            ->orderBy('project_name', 'asc')
            ->get();

        $employees = Employee::select('id', 'name', 'employee_code', 'avatar')
            ->where('status', 'active')
            ->orderBy('name', 'asc')
            ->get();

        // Stats calculation
        $allProjectTasks = ProjectTask::whereIn('website_project_id', $projectIds)->get();
        $stats = [
            'total' => $allProjectTasks->count(),
            'todo' => $allProjectTasks->where('status', 'todo')->count(),
            'in_progress' => $allProjectTasks->where('status', 'in_progress')->count(),
            'in_review' => $allProjectTasks->where('status', 'in_review')->count(),
            'completed' => $allProjectTasks->where('status', 'completed')->count(),
        ];

        return Inertia::render('client-portal/tasks/index', [
            'client' => $client,
            'tasks' => $tasks,
            'projects' => $projects,
            'employees' => $employees,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'priority', 'project_id']),
        ]);
    }

    /**
     * Display detailed view of a single task.
     */
    public function show(ProjectTask $task): Response
    {
        $clientId = $this->getClientId();
        $client   = $this->getClientModel();

        // Ensure task belongs to client's project
        $task->load([
            'websiteProject:id,project_name,client_id,status,progress_percentage,start_date,deadline,total_budget,currency,notes',
            'assignedEmployee:id,name,employee_code,avatar',
        ]);

        if (!$task->websiteProject || $task->websiteProject->client_id !== $clientId) {
            abort(403, 'Unauthorized access to task.');
        }

        // Sibling tasks of same project (other than current)
        $siblingTasks = ProjectTask::where('website_project_id', $task->website_project_id)
            ->where('id', '!=', $task->id)
            ->with('assignedEmployee:id,name,employee_code,avatar')
            ->orderBy('due_date', 'asc')
            ->limit(5)
            ->get();

        return Inertia::render('client-portal/tasks/show', [
            'client'       => $client,
            'task'         => $task,
            'siblingTasks' => $siblingTasks,
        ]);
    }

    /**
     * Store a newly created task.
     */
    public function store(Request $request): RedirectResponse
    {
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

    /**
     * Update an existing task.
     */
    public function update(Request $request, ProjectTask $task): RedirectResponse
    {
        $clientId = $this->getClientId();

        // Verify task ownership via websiteProject
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

        return redirect()->back()->with('success', 'Project task updated successfully.');
    }

    /**
     * Remove the specified task.
     */
    public function destroy(ProjectTask $task): RedirectResponse
    {
        $clientId = $this->getClientId();

        if (!$task->websiteProject || $task->websiteProject->client_id !== $clientId) {
            abort(403, 'Unauthorized access to task');
        }

        if ($task->status === 'completed') {
            return redirect()->back()->with('error', 'Completed tasks cannot be deleted to preserve accurate project progress calculations.');
        }

        $task->delete();

        return redirect()->back()->with('success', 'Project task deleted successfully.');
    }
}
