<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Task;
use App\Models\TaskCategory;
use App\Models\User;
use App\Notifications\CrmNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class TaskController extends Controller
{
    /**
     * Display a listing of general tasks.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-tasks') && !$user->can('view-tasks'))) {
            abort(403, 'Unauthorized. You do not have permission to view general tasks.');
        }

        $query = Task::with(['taskCategory', 'assignedEmployee.department', 'createdBy'])
            ->withCount('messages');

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('task_title', 'like', "%{$search}%")
                    ->orWhere('task_code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('task_category_id')) {
            $query->where('task_category_id', $request->query('task_category_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->query('priority'));
        }

        if ($request->filled('assigned_employee_id')) {
            $query->where('assigned_employee_id', $request->query('assigned_employee_id'));
        }

        $tasks = $query->latest()->paginate(15)->withQueryString();

        $stats = [
            'total' => Task::count(),
            'todo' => Task::where('status', 'todo')->count(),
            'in_progress' => Task::where('status', 'in_progress')->count(),
            'completed' => Task::where('status', 'completed')->count(),
            'urgent' => Task::where('priority', 'urgent')->where('status', '!=', 'completed')->count(),
        ];

        $categories = TaskCategory::where('is_active', true)->orderBy('name', 'asc')->get(['id', 'name']);
        $employees = Employee::where('status', 'active')->orderBy('name', 'asc')->get(['id', 'name', 'employee_code']);

        return Inertia::render('tasks/index', [
            'tasks' => $tasks,
            'stats' => $stats,
            'categories' => $categories,
            'employees' => $employees,
            'filters' => $request->only(['search', 'task_category_id', 'status', 'priority', 'assigned_employee_id']),
        ]);
    }

    /**
     * Show form for creating a new task.
     */
    public function create(): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('create-tasks') && !$user->can('create-tasks'))) {
            abort(403, 'Unauthorized. You do not have permission to create general tasks.');
        }

        $categories = TaskCategory::where('is_active', true)->orderBy('name', 'asc')->get(['id', 'name']);
        $employees = Employee::where('status', 'active')->orderBy('name', 'asc')->get(['id', 'name', 'employee_code']);

        return Inertia::render('tasks/create', [
            'categories' => $categories,
            'employees' => $employees,
            'next_code' => Task::generateTaskCode(),
        ]);
    }

    /**
     * Store a newly created task.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('create-tasks') && !$user->can('create-tasks'))) {
            abort(403, 'Unauthorized. You do not have permission to create general tasks.');
        }

        $validated = $request->validate([
            'task_title' => ['required', 'string', 'max:255'],
            'task_category_id' => ['required', 'exists:task_categories,id'],
            'assigned_employee_id' => ['nullable', 'exists:employees,id'],
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'status' => ['required', Rule::in(['todo', 'in_progress', 'in_review', 'completed', 'cancelled'])],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'description' => ['nullable', 'string'],
            'attachment' => ['nullable', 'file', 'max:10240', 'mimes:jpeg,png,jpg,webp,pdf,doc,docx,xls,xlsx,zip,txt'],
        ]);

        $task = new Task($validated);
        $task->task_code = Task::generateTaskCode();
        $task->created_by_user_id = auth()->id();

        if ($request->hasFile('attachment')) {
            $task->attachment = $request->file('attachment');
        }

        if ($validated['status'] === 'completed') {
            $task->completed_at = now();
        }

        $task->save();

        // Trigger Notification to Assigned Employee
        if ($task->assigned_employee_id) {
            $employeeUser = User::where('employee_id', $task->assigned_employee_id)->first();
            if ($employeeUser && $employeeUser->id !== auth()->id()) {
                $employeeUser->notify(new CrmNotification(
                    "New Task Assigned: {$task->task_title}",
                    "You have been assigned task '{$task->task_title}' (Code: {$task->task_code}, Priority: " . ucfirst($task->priority) . ").",
                    'task_assigned',
                    $task->priority === 'urgent' ? 'urgent' : ($task->priority === 'high' ? 'warning' : 'info'),
                    '/tasks',
                    ['task_id' => $task->id, 'task_code' => $task->task_code]
                ));
            }
        }

        return redirect()->route('tasks.index')->with('success', "Task {$task->task_code} created successfully!");
    }

    /**
     * Show form for editing an existing task.
     */
    public function edit(Task $task): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('edit-tasks') && !$user->can('edit-tasks'))) {
            abort(403, 'Unauthorized. You do not have permission to edit general tasks.');
        }

        $task->load(['taskCategory', 'assignedEmployee', 'createdBy']);

        $categories = TaskCategory::where('is_active', true)->orderBy('name', 'asc')->get(['id', 'name']);
        $employees = Employee::where('status', 'active')->orderBy('name', 'asc')->get(['id', 'name', 'employee_code']);

        return Inertia::render('tasks/edit', [
            'task' => $task,
            'categories' => $categories,
            'employees' => $employees,
        ]);
    }

    /**
     * Update the specified task.
     */
    public function update(Request $request, Task $task): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('edit-tasks') && !$user->can('edit-tasks'))) {
            abort(403, 'Unauthorized. You do not have permission to edit general tasks.');
        }

        $validated = $request->validate([
            'task_title' => ['required', 'string', 'max:255'],
            'task_category_id' => ['required', 'exists:task_categories,id'],
            'assigned_employee_id' => ['nullable', 'exists:employees,id'],
            'priority' => ['required', Rule::in(['low', 'medium', 'high', 'urgent'])],
            'status' => ['required', Rule::in(['todo', 'in_progress', 'in_review', 'completed', 'cancelled'])],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'description' => ['nullable', 'string'],
            'attachment' => ['nullable'],
            'remove_attachment' => ['nullable', 'boolean'],
        ]);

        $oldStatus = $task->status;
        $oldAssignedId = $task->assigned_employee_id;

        if ($request->boolean('remove_attachment')) {
            $task->attachment = null;
        } elseif ($request->hasFile('attachment')) {
            $task->attachment = $request->file('attachment');
        }

        if ($validated['status'] === 'completed' && $oldStatus !== 'completed') {
            $task->completed_at = now();
        } elseif ($validated['status'] !== 'completed') {
            $task->completed_at = null;
        }

        unset($validated['attachment'], $validated['remove_attachment']);
        $task->fill($validated);
        $task->save();

        // Notify newly assigned employee if assignment changed
        if ($task->assigned_employee_id && $task->assigned_employee_id !== $oldAssignedId) {
            $employeeUser = User::where('employee_id', $task->assigned_employee_id)->first();
            if ($employeeUser && $employeeUser->id !== auth()->id()) {
                $employeeUser->notify(new CrmNotification(
                    "Task Assigned: {$task->task_title}",
                    "You have been assigned task '{$task->task_title}' (Code: {$task->task_code}).",
                    'task_assigned',
                    'info',
                    '/tasks',
                    ['task_id' => $task->id, 'task_code' => $task->task_code]
                ));
            }
        }

        // Notify Super Admins if completed
        if ($validated['status'] === 'completed' && $oldStatus !== 'completed') {
            $superAdmins = User::whereHas('roles', fn($q) => $q->whereIn('name', ['Super Admin', 'super admin', 'super-admin']))->get();
            foreach ($superAdmins as $admin) {
                if ($admin->id !== auth()->id()) {
                    $admin->notify(new CrmNotification(
                        "Task Completed: {$task->task_title}",
                        "Task '{$task->task_title}' ({$task->task_code}) was marked as completed by " . (auth()->user()?->name ?? 'staff') . ".",
                        'task_completed',
                        'success',
                        '/tasks',
                        ['task_id' => $task->id, 'task_code' => $task->task_code]
                    ));
                }
            }
        }

        return redirect()->route('tasks.index')->with('success', "Task {$task->task_code} updated successfully!");
    }

    /**
     * Download task attachment.
     */
    public function downloadAttachment(Task $task): BinaryFileResponse|RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-tasks') && !$user->can('view-tasks'))) {
            abort(403, 'Unauthorized. You do not have permission to download task attachments.');
        }

        if (!$task->attachment || !file_exists(public_path($task->attachment))) {
            return redirect()->back()->with('error', 'Task attachment file not found.');
        }

        $filePath = public_path($task->attachment);
        $filename = $task->attachment_name ?? basename($filePath);

        return response()->download($filePath, $filename);
    }

    /**
     * Quick status update for task.
     */
    public function updateStatus(Request $request, Task $task): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('edit-tasks') && !$user->can('edit-tasks'))) {
            abort(403, 'Unauthorized. You do not have permission to edit general tasks.');
        }

        $request->validate([
            'status' => ['required', Rule::in(['todo', 'in_progress', 'in_review', 'completed', 'cancelled'])],
        ]);

        $oldStatus = $task->status;
        $status = $request->input('status');
        $task->status = $status;
        if ($status === 'completed') {
            $task->completed_at = now();
        } else {
            $task->completed_at = null;
        }
        $task->save();

        if ($status === 'completed' && $oldStatus !== 'completed') {
            $superAdmins = User::whereHas('roles', fn($q) => $q->whereIn('name', ['Super Admin', 'super admin', 'super-admin']))->get();
            foreach ($superAdmins as $admin) {
                if ($admin->id !== auth()->id()) {
                    $admin->notify(new CrmNotification(
                        "Task Completed: {$task->task_title}",
                        "Task '{$task->task_title}' ({$task->task_code}) was marked as completed.",
                        'task_completed',
                        'success',
                        '/tasks',
                        ['task_id' => $task->id, 'task_code' => $task->task_code]
                    ));
                }
            }
        }

        return redirect()->back()->with('success', "Task {$task->task_code} status updated to " . ucfirst(str_replace('_', ' ', $status)) . "!");
    }

    /**
     * Delete the specified task.
     */
    public function destroy(Task $task): RedirectResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('delete-tasks') && !$user->can('delete-tasks'))) {
            abort(403, 'Unauthorized. You do not have permission to delete general tasks.');
        }

        $code = $task->task_code;
        $task->delete();

        return redirect()->route('tasks.index')->with('success', "Task {$code} deleted successfully!");
    }
}
