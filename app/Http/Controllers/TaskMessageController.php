<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ProjectTask;
use App\Models\ServiceTask;
use App\Models\Task;
use App\Models\TaskMessage;
use App\Models\User;
use App\Notifications\CrmNotification;
use App\Services\TaskNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class TaskMessageController extends Controller
{
    /**
     * Display dedicated task details and conversation page.
     */
    public function show(Request $request, string $type, int $id): InertiaResponse
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $task = $this->resolveTask($type, $id);
        if (!$task) {
            abort(404, 'Task not found');
        }

        if (!$this->canAccessTask($user, $type, $task)) {
            abort(403, 'Unauthorized access to this task.');
        }

        $task->load([
            'messages.user:id,name,email,avatar,type,employee_id',
            'assignedEmployee.designation:id,name',
            'assignedEmployee.department:id,name',
        ]);

        $clientData = null;
        $sourceTitle = 'General Task';
        $sourceId = null;
        $sourceUrl = null;
        $isClient = $user->type === 'client';
        $from = $request->query('from');
        if ($from && (!str_starts_with($from, '/') || str_starts_with($from, '//'))) {
            $from = null;
        }

        if ($type === 'project') {
            $sourceTitle = $task->websiteProject ? ($task->websiteProject->project_name ?? 'Website Project') : 'Project Task';
            $sourceId = $task->websiteProject?->id ?? $task->website_project_id;
            $sourceUrl = $isClient
                ? ($sourceId ? "/client-portal/projects/{$sourceId}?tab=tasks" : "/client-portal/projects")
                : ($sourceId ? "/projects/{$sourceId}?tab=tasks" : "/projects");

            if ($task->websiteProject && $task->websiteProject->client) {
                $clientData = [
                    'id' => $task->websiteProject->client->id,
                    'name' => $task->websiteProject->client->name,
                    'company_name' => $task->websiteProject->client->company_name,
                    'client_code' => $task->websiteProject->client->client_code,
                    'currency' => $task->websiteProject->client->currency ?? 'USD',
                ];
            }
        } elseif ($type === 'service') {
            $sourceTitle = $task->service ? ($task->service->service_name ?? 'Client Service') : 'Service Task';
            $sourceId = $task->service?->id ?? $task->client_service_id;
            $sourceUrl = $isClient
                ? ($sourceId ? "/client-portal/services/{$sourceId}?tab=tasks" : "/client-portal/services")
                : ($sourceId ? "/services/{$sourceId}?tab=tasks" : "/services");

            if ($task->service && $task->service->client) {
                $clientData = [
                    'id' => $task->service->client->id,
                    'name' => $task->service->client->name,
                    'company_name' => $task->service->client->company_name,
                    'client_code' => $task->service->client->client_code,
                    'currency' => $task->service->client->currency ?? 'USD',
                ];
            }
        } elseif ($type === 'general') {
            $sourceTitle = $task->taskCategory ? $task->taskCategory->name : 'General Task';
            $sourceId = $task->id;
            $sourceUrl = '/tasks';
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
            'source_id' => $sourceId,
            'source_title' => $sourceTitle,
            'source_url' => $sourceUrl,
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

        return Inertia::render('tasks/show', [
            'client' => $clientData,
            'task' => $taskData,
            'from' => $from,
        ]);
    }

    /**
     * Update task status from the detail page.
     */
    public function updateStatus(Request $request, string $type, int $id): RedirectResponse
    {
        $user = Auth::user();
        if (!$user) {
            abort(401, 'Unauthenticated');
        }

        $task = $this->resolveTask($type, $id);
        if (!$task) {
            abort(404, 'Task not found');
        }

        if (!$this->canAccessTask($user, $type, $task)) {
            abort(403, 'Unauthorized access to update this task.');
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
            TaskNotificationService::notifyTaskUpdated($task, $type, ['status' => $validated['status']]);
        }

        return redirect()->back()->with('success', 'Task status updated successfully.');
    }

    /**
     * Retrieve all messages/comments for a specific task.
     */
    public function index(Request $request, string $type, int $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $task = $this->resolveTask($type, $id);
        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        if (!$this->canAccessTask($user, $type, $task)) {
            return response()->json(['error' => 'Unauthorized access to this task.'], 403);
        }

        $messages = $task->messages()
            ->with('user:id,name,email,avatar,type,employee_id')
            ->get();

        $clientData = null;
        $sourceTitle = 'General Task';
        $sourceId = null;

        if ($type === 'project' && $task->websiteProject) {
            $sourceTitle = $task->websiteProject->project_name ?? 'Website Project';
            $sourceId = $task->websiteProject->id;
            if ($task->websiteProject->client) {
                $clientData = [
                    'id' => $task->websiteProject->client->id,
                    'name' => $task->websiteProject->client->name,
                    'company_name' => $task->websiteProject->client->company_name,
                    'client_code' => $task->websiteProject->client->client_code,
                ];
            }
        } elseif ($type === 'service' && $task->service) {
            $sourceTitle = $task->service->service_name ?? 'Client Service';
            $sourceId = $task->service->id;
            if ($task->service->client) {
                $clientData = [
                    'id' => $task->service->client->id,
                    'name' => $task->service->client->name,
                    'company_name' => $task->service->client->company_name,
                    'client_code' => $task->service->client->client_code,
                ];
            }
        } elseif ($type === 'general') {
            $sourceTitle = $task->taskCategory ? $task->taskCategory->name : 'General Task';
            $sourceId = $task->id;
        }

        return response()->json([
            'success' => true,
            'task' => [
                'id' => $task->id,
                'task_title' => $task->task_title,
                'status' => $task->status,
                'priority' => $task->priority,
                'start_date' => $task->start_date ? $task->start_date->toDateString() : null,
                'due_date' => $task->due_date ? $task->due_date->toDateString() : null,
                'completed_at' => $task->completed_at ? $task->completed_at->toISOString() : null,
                'description' => $task->description,
                'source_type' => $type,
                'source_id' => $sourceId,
                'source_title' => $sourceTitle,
                'client' => $clientData,
                'assigned_employee' => $task->assignedEmployee ? [
                    'id' => $task->assignedEmployee->id,
                    'name' => $task->assignedEmployee->name,
                    'employee_code' => $task->assignedEmployee->employee_code,
                    'avatar' => $task->assignedEmployee->avatar,
                ] : null,
            ],
            'messages' => $messages,
        ]);
    }

    /**
     * Post a new message or query to a task.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'task_type' => 'required|in:project,service,general',
            'task_id' => 'required|integer',
            'message' => 'required_without:attachment|nullable|string|max:5000',
            'attachment' => 'nullable|file|max:10240', // max 10MB
        ]);

        $task = $this->resolveTask($validated['task_type'], (int) $validated['task_id']);
        if (!$task) {
            return response()->json(['error' => 'Task not found'], 404);
        }

        if (!$this->canAccessTask($user, $validated['task_type'], $task)) {
            return response()->json(['error' => 'Unauthorized access to this task.'], 403);
        }

        if (!$task->assigned_employee_id) {
            return response()->json([
                'error' => 'This task must be assigned to an employee before starting a discussion or sending queries.',
            ], 422);
        }

        $attachmentPath = null;
        $attachmentName = null;

        if ($request->hasFile('attachment') && $request->file('attachment')->isValid()) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $filename = 'task_' . $validated['task_type'] . '_' . $task->id . '_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/task-messages'), $filename);
            $attachmentPath = '/uploads/task-messages/' . $filename;
        }

        $message = new TaskMessage([
            'user_id' => $user->id,
            'message' => $validated['message'] ?? '',
            'attachment' => $attachmentPath,
            'attachment_name' => $attachmentName,
        ]);

        $task->messages()->save($message);
        $message->load('user:id,name,email,avatar,type,employee_id');

        // Trigger in-app notification
        $this->dispatchTaskMessageNotification($user, $task, $validated['task_type'], $message);

        return response()->json([
            'success' => true,
            'message' => $message,
        ]);
    }

    /**
     * Delete a message/comment.
     */
    public function destroy(Request $request, int $message): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $taskMessage = $message instanceof TaskMessage ? $message : TaskMessage::find($message);
        if (!$taskMessage) {
            return response()->json(['error' => 'Message not found'], 404);
        }

        // Allow owner or Admin to delete message
        $isOwner = $taskMessage->user_id === $user->id;
        $isAdmin = ($user->type === 'admin' || $user->hasRole('Super Admin') || $user->hasRole('admin'));

        if (!$isOwner && !$isAdmin) {
            return response()->json(['error' => 'Unauthorized to delete this message'], 403);
        }

        if ($taskMessage->attachment && file_exists(public_path($taskMessage->attachment))) {
            @unlink(public_path($taskMessage->attachment));
        }
        $taskMessage->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully',
        ]);
    }

    /**
     * Helper to resolve the model based on type.
     */
    protected function resolveTask(string $type, int $id)
    {
        return match ($type) {
            'project' => ProjectTask::with(['websiteProject.client', 'assignedEmployee'])->find($id),
            'service' => ServiceTask::with(['service.client', 'assignedEmployee'])->find($id),
            'general' => Task::with(['taskCategory', 'assignedEmployee'])->find($id),
            default => null,
        };
    }

    /**
     * Determine if the user is an employee and get their employee ID.
     */
    protected function isEmployeeUser(?User $user): array
    {
        if (!$user) {
            return [false, null];
        }

        $isAdmin = $user->hasRole('admin') || $user->hasRole('Super Admin') || $user->type === 'admin';
        if ($isAdmin) {
            return [false, null];
        }

        $isEmployee = $user->type === 'employee' || !empty($user->employee_id);
        $employeeId = null;

        if ($isEmployee) {
            if ($user->employee_id) {
                $employeeId = $user->employee_id;
            } else {
                $employee = Employee::where('user_id', $user->id)
                    ->orWhere('email', $user->email)
                    ->first();
                $employeeId = $employee?->id;
            }
        }

        return [$isEmployee, $employeeId];
    }

    /**
     * Check if the authenticated user has authorization to access the specific task.
     */
    protected function canAccessTask(User $user, string $type, $task): bool
    {
        if ($type === 'general') {
            [$isEmployee, $employeeId] = $this->isEmployeeUser($user);
            if ($isEmployee) {
                return (int) $task->assigned_employee_id === (int) $employeeId;
            }
        }

        return true;
    }

    /**
     * Dispatch notification to Admin(s) if Employee/Client sent, or to Employee/Client if Admin sent.
     */
    protected function dispatchTaskMessageNotification(User $sender, $task, string $type, TaskMessage $message): void
    {
        $taskTitle = $task->task_title ?? 'Task';
        $sourceTitle = match ($type) {
            'project' => $task->websiteProject?->project_name ?? 'Website Project',
            'service' => $task->service?->service_name ?? 'Client Service',
            default => ($task->taskCategory?->name ?? 'General Task'),
        };

        $isSenderAdmin = ($sender->type === 'admin' || $sender->hasRole('Super Admin') || $sender->hasRole('admin'));
        $isSenderClient = ($sender->type === 'client');

        $projectId = $task->website_project_id ?? $task->websiteProject?->id;
        $serviceId = $task->client_service_id ?? $task->service?->id;

        // Dedicated URL for Admin recipients
        $adminActionUrl = match ($type) {
            'project' => $projectId ? "/projects/{$projectId}/tasks/{$task->id}/conversation" : "/projects",
            'service' => $serviceId ? "/services/{$serviceId}/tasks/{$task->id}/conversation" : "/services",
            default => "/my-tasks/task/general/{$task->id}/conversation",
        };

        // Dedicated URL for Employee recipients
        $employeeActionUrl = "/my-tasks/task/{$type}/{$task->id}/conversation";

        // Dedicated URL for Client Portal recipients
        $clientActionUrl = match ($type) {
            'project' => $projectId ? "/client-portal/projects/{$projectId}/tasks/{$task->id}/conversation" : "/client-portal/projects",
            'service' => $serviceId ? "/client-portal/services/{$serviceId}/tasks/{$task->id}/conversation" : "/client-portal/services",
            default => "/tasks",
        };

        if (!$isSenderAdmin) {
            // Sender is Employee or Client -> Notify All Admins
            $admins = User::where('type', 'admin')
                ->orWhereHas('roles', fn($q) => $q->whereIn('name', ['Super Admin', 'Admin', 'super admin', 'admin']))
                ->get();

            foreach ($admins as $admin) {
                if ($admin->id !== $sender->id) {
                    $admin->notify(new CrmNotification(
                        "Task Query: {$taskTitle}",
                        "{$sender->name} posted a message on {$sourceTitle} task '{$taskTitle}': " . Str::limit($message->message, 100),
                        'task_message',
                        'info',
                        $adminActionUrl,
                        [
                            'task_id' => $task->id,
                            'task_type' => $type,
                            'task_title' => $taskTitle,
                            'sender_id' => $sender->id,
                            'sender_name' => $sender->name,
                        ]
                    ));
                }
            }
        }

        // Notify Assigned Employee (if sender is not the assigned employee)
        $employeeId = $task->assigned_employee_id;
        if ($employeeId) {
            $employeeUser = User::where('employee_id', $employeeId)
                ->orWhereHas('employee', fn($q) => $q->where('id', $employeeId))
                ->first();

            if ($employeeUser && $employeeUser->id !== $sender->id) {
                $employeeUser->notify(new CrmNotification(
                    "New Reply on Task: {$taskTitle}",
                    "{$sender->name} replied on {$sourceTitle} task '{$taskTitle}': " . Str::limit($message->message, 100),
                    'task_message',
                    'info',
                    $employeeActionUrl,
                    [
                        'task_id' => $task->id,
                        'task_type' => $type,
                        'task_title' => $taskTitle,
                        'sender_id' => $sender->id,
                        'sender_name' => $sender->name,
                    ]
                ));
            }
        }

        // Notify Client Portal User (if project/service belongs to a client and sender is not the client)
        $clientModel = null;
        if ($type === 'project' && $task->websiteProject) {
            $clientModel = $task->websiteProject->client;
        } elseif ($type === 'service' && $task->service) {
            $clientModel = $task->service->client;
        }

        if ($clientModel && !$isSenderClient) {
            $clientUser = $clientModel->user ?: User::where('type', 'client')->where('client_id', $clientModel->id)->first();
            if ($clientUser && $clientUser->id !== $sender->id) {
                $clientUser->notify(new CrmNotification(
                    "New Reply on Task: {$taskTitle}",
                    "{$sender->name} replied on {$sourceTitle} task '{$taskTitle}': " . Str::limit($message->message, 100),
                    'task_message',
                    'info',
                    $clientActionUrl,
                    [
                        'task_id' => $task->id,
                        'task_type' => $type,
                        'task_title' => $taskTitle,
                        'sender_id' => $sender->id,
                        'sender_name' => $sender->name,
                    ]
                ));
            }
        }
    }
}
