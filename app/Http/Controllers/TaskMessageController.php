<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\ProjectTask;
use App\Models\ServiceTask;
use App\Models\Task;
use App\Models\TaskMessage;
use App\Models\User;
use App\Notifications\CrmNotification;
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

        // Auto sync client context if accessing project/service task
        $clientId = null;
        if ($type === 'project' && $task->websiteProject) {
            $clientId = $task->websiteProject->client_id;
        } elseif ($type === 'service' && $task->service) {
            $clientId = $task->service->client_id;
        }

        if ($clientId && $user->client_id !== $clientId && ($user->type === 'admin' || $user->type === 'employee')) {
            $user->updateQuietly(['client_id' => $clientId]);
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

        if ($type === 'project' && $task->websiteProject) {
            $sourceTitle = $task->websiteProject->project_name ?? 'Website Project';
            $sourceId = $task->websiteProject->id;
            $sourceUrl = "/client-portal/projects/{$task->websiteProject->id}?tab=tasks";
            if ($task->websiteProject->client) {
                $clientData = [
                    'id' => $task->websiteProject->client->id,
                    'name' => $task->websiteProject->client->name,
                    'company_name' => $task->websiteProject->client->company_name,
                    'client_code' => $task->websiteProject->client->client_code,
                    'currency' => $task->websiteProject->client->currency ?? 'USD',
                ];
            }
        } elseif ($type === 'service' && $task->service) {
            $sourceTitle = $task->service->service_name ?? 'Client Service';
            $sourceId = $task->service->id;
            $sourceUrl = "/client-portal/services/{$task->service->id}?tab=tasks";
            if ($task->service->client) {
                $clientData = [
                    'id' => $task->service->client->id,
                    'name' => $task->service->client->name,
                    'company_name' => $task->service->client->company_name,
                    'client_code' => $task->service->client->client_code,
                    'currency' => $task->service->client->currency ?? 'USD',
                ];
            }
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
            'source_type' => $type,
            'source_id' => $sourceId,
            'source_title' => $sourceTitle,
            'source_url' => $sourceUrl,
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

        $attachmentPath = null;
        $attachmentName = null;

        if ($request->hasFile('attachment') && $request->file('attachment')->isValid()) {
            $file = $request->file('attachment');
            $attachmentName = $file->getClientOriginalName();
            $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/task_messages'), $filename);
            $attachmentPath = '/uploads/task_messages/' . $filename;
        }

        $message = new TaskMessage([
            'user_id' => $user->id,
            'message' => $validated['message'] ?? 'Attached a file',
            'attachment' => $attachmentPath,
            'attachment_name' => $attachmentName,
        ]);

        $task->messages()->save($message);
        $message->load('user:id,name,email,avatar,type,employee_id');

        // Dispatch notifications between Admin & Employee
        $this->dispatchTaskMessageNotification($user, $task, $validated['task_type'], $message);

        return response()->json([
            'success' => true,
            'message' => $message,
        ]);
    }

    /**
     * Delete a task message.
     */
    public function destroy(Request $request, $message): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $taskMessage = $message instanceof TaskMessage ? $message : TaskMessage::find($message);
        if (!$taskMessage) {
            return response()->json(['error' => 'Message not found or already deleted'], 404);
        }

        // Allow deletion if user is author OR user is an admin OR has management access
        $isAdmin = ($user->type === 'admin' || $user->hasRole('Super Admin') || $user->hasRole('admin'));
        if ((int) $taskMessage->user_id !== (int) $user->id && !$isAdmin) {
            return response()->json(['error' => 'Unauthorized: You can only delete your own messages.'], 403);
        }

        if (method_exists($taskMessage, 'deleteOldAttachmentFile')) {
            $taskMessage->deleteOldAttachmentFile();
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
            'general' => Task::with(['assignedEmployee'])->find($id),
            default => null,
        };
    }

    /**
     * Dispatch notification to Admin(s) if Employee sent, or to Employee if Admin sent.
     */
    protected function dispatchTaskMessageNotification(User $sender, $task, string $type, TaskMessage $message): void
    {
        $taskTitle = $task->task_title ?? 'Task';
        $sourceTitle = match ($type) {
            'project' => $task->websiteProject?->project_name ?? 'Website Project',
            'service' => $task->service?->service_name ?? 'Client Service',
            default => 'General Task',
        };

        $isSenderAdmin = ($sender->type === 'admin' || $sender->hasRole('Super Admin') || $sender->hasRole('admin'));
        $actionUrl = "/tasks/detail/{$type}/{$task->id}";

        if (!$isSenderAdmin) {
            // Sender is Employee -> Notify All Admins
            $admins = User::where('type', 'admin')
                ->orWhereHas('roles', fn($q) => $q->whereIn('name', ['Super Admin', 'Admin', 'super admin', 'admin']))
                ->get();

            foreach ($admins as $admin) {
                if ($admin->id !== $sender->id) {
                    $admin->notify(new CrmNotification(
                        "Task Query: {$taskTitle}",
                        "{$sender->name} posted a query on {$sourceTitle} task '{$taskTitle}': " . Str::limit($message->message, 100),
                        'task_message',
                        'info',
                        $actionUrl,
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
        } else {
            // Sender is Admin -> Notify Assigned Employee
            $employeeId = $task->assigned_employee_id;
            if ($employeeId) {
                $employeeUser = User::where('employee_id', $employeeId)
                    ->orWhereHas('employee', fn($q) => $q->where('id', $employeeId))
                    ->first();

                if ($employeeUser && $employeeUser->id !== $sender->id) {
                    $employeeUser->notify(new CrmNotification(
                        "Admin Reply on Task: {$taskTitle}",
                        "{$sender->name} replied on {$sourceTitle} task '{$taskTitle}': " . Str::limit($message->message, 100),
                        'task_message',
                        'info',
                        $actionUrl,
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
}
