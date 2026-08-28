<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ProjectTask;
use App\Models\WebsiteProject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MyTaskController extends Controller
{
    /**
     * Display a listing of assigned project tasks for the authenticated employee.
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

        $query = ProjectTask::with([
            'websiteProject.client:id,name,company_name,client_code,currency',
            'websiteProject.category:id,name',
            'assignedEmployee:id,name,employee_code,avatar',
        ]);

        // If user is employee, strictly filter by their employee_id
        if ($user->type === 'employee') {
            $employeeId = $employee ? $employee->id : 0;
            $query->where('assigned_employee_id', $employeeId);
            $baseStatsQuery = ProjectTask::where('assigned_employee_id', $employeeId);
        } else {
            // If admin, allow optional filtering by employee
            if ($request->filled('employee_id')) {
                $query->where('assigned_employee_id', $request->query('employee_id'));
                $baseStatsQuery = ProjectTask::where('assigned_employee_id', $request->query('employee_id'));
            } else {
                $baseStatsQuery = ProjectTask::query();
            }
        }

        // Search Filter
        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
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

        // Status Filter
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        // Priority Filter
        if ($request->filled('priority')) {
            $query->where('priority', $request->query('priority'));
        }

        // Project Filter
        if ($request->filled('project_id')) {
            $query->where('website_project_id', $request->query('project_id'));
        }

        // Sorting: non-completed first, then due_date asc
        $tasks = $query->orderByRaw("CASE WHEN status = 'completed' THEN 2 ELSE 1 END")
            ->orderBy('due_date', 'asc')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        // Calculate KPI Stats
        $stats = [
            'total' => (clone $baseStatsQuery)->count(),
            'todo' => (clone $baseStatsQuery)->where('status', 'todo')->count(),
            'in_progress' => (clone $baseStatsQuery)->where('status', 'in_progress')->count(),
            'in_review' => (clone $baseStatsQuery)->where('status', 'in_review')->count(),
            'completed' => (clone $baseStatsQuery)->where('status', 'completed')->count(),
            'urgent' => (clone $baseStatsQuery)->where('priority', 'urgent')->where('status', '!=', 'completed')->count(),
        ];

        // Retrieve projects list for filter dropdown
        $projects = WebsiteProject::select('id', 'project_name')
            ->orderBy('project_name', 'asc')
            ->get();

        return Inertia::render('my-tasks/index', [
            'tasks' => $tasks,
            'stats' => $stats,
            'projects' => $projects,
            'employee' => $employee,
            'filters' => [
                'search' => $request->query('search', ''),
                'status' => $request->query('status', ''),
                'priority' => $request->query('priority', ''),
                'project_id' => $request->query('project_id', ''),
            ],
        ]);
    }

    /**
     * Update status of an assigned task.
     */
    public function updateStatus(Request $request, ProjectTask $task): RedirectResponse
    {
        $user = Auth::user();

        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        // Check ownership if user is employee
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
}
