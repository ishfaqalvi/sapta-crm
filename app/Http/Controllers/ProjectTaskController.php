<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ProjectTask;
use App\Models\WebsiteProject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectTaskController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ProjectTask::with(['websiteProject:id,project_name,client_id', 'websiteProject.client:id,name', 'assignedEmployee:id,name,employee_code,avatar']);

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

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('project_id')) {
            $query->where('website_project_id', $request->project_id);
        }

        if ($request->filled('employee_id')) {
            $query->where('assigned_employee_id', $request->employee_id);
        }

        $tasks = $query->orderBy('due_date', 'asc')
            ->orderBy('id', 'desc')
            ->paginate(12)
            ->withQueryString();

        $projects = WebsiteProject::select('id', 'project_name')->orderBy('project_name', 'asc')->get();
        $employees = Employee::select('id', 'name', 'employee_code', 'avatar')->where('status', 'active')->orderBy('name', 'asc')->get();

        return Inertia::render('projects/tasks/index', [
            'tasks' => $tasks,
            'projects' => $projects,
            'employees' => $employees,
            'filters' => $request->only(['search', 'status', 'priority', 'project_id', 'employee_id']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'website_project_id' => 'required|exists:website_projects,id',
            'assigned_employee_id' => 'nullable|exists:employees,id',
            'task_title' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'required|in:todo,in_progress,in_review,completed,cancelled',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'description' => 'nullable|string',
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

    public function update(Request $request, ProjectTask $task): RedirectResponse
    {
        $validated = $request->validate([
            'website_project_id' => 'required|exists:website_projects,id',
            'assigned_employee_id' => 'nullable|exists:employees,id',
            'task_title' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high,urgent',
            'status' => 'required|in:todo,in_progress,in_review,completed,cancelled',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'description' => 'nullable|string',
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

    public function destroy(ProjectTask $task): RedirectResponse
    {
        $task->delete();

        return redirect()->back()->with('success', 'Task deleted successfully.');
    }
}
