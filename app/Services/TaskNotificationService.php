<?php

namespace App\Services;

use App\Mail\TaskAssignedMail;
use App\Mail\TaskUpdatedMail;
use App\Models\Employee;
use App\Models\ProjectTask;
use App\Models\ServiceTask;
use App\Models\Task;
use App\Models\User;
use App\Notifications\CrmNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class TaskNotificationService
{
    /**
     * Send email and in-app notifications whenever a task is assigned or reassigned to an employee.
     *
     * @param Task|ProjectTask|ServiceTask $task
     * @param string $type ('general'|'project'|'service')
     * @param int|null $previousEmployeeId
     * @return void
     */
    public static function notifyAssignedEmployee($task, string $type = 'general', ?int $previousEmployeeId = null): void
    {
        if (empty($task->assigned_employee_id)) {
            return;
        }

        // If previously assigned to the exact same employee, do not re-send
        if (!is_null($previousEmployeeId) && (int) $task->assigned_employee_id === (int) $previousEmployeeId) {
            return;
        }

        // Eager load necessary relations
        if ($type === 'project') {
            $task->loadMissing(['websiteProject.client']);
        } elseif ($type === 'service') {
            $task->loadMissing(['service.client']);
        } elseif ($type === 'general') {
            $task->loadMissing(['taskCategory']);
        }

        $employee = Employee::with('user')->find($task->assigned_employee_id);
        if (!$employee) {
            return;
        }

        $assignedBy = Auth::user();

        // 1. Send Email Notification to Employee
        $recipientEmail = $employee->email ?: ($employee->user?->email ?? null);

        if (!empty($recipientEmail) && filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
            try {
                Mail::to($recipientEmail)->send(new TaskAssignedMail(
                    $task,
                    $type,
                    $employee,
                    $assignedBy
                ));
            } catch (\Throwable $e) {
                Log::warning("Failed to send task assigned email to {$recipientEmail} for task ID {$task->id}: " . $e->getMessage());
            }
        }

        // 2. Send In-App CRM Database Notification (if employee has CRM login user account)
        if ($employee->user && (!$assignedBy || $employee->user->id !== $assignedBy->id)) {
            $sourceInfo = '';
            $actionUrl = "/my-tasks/task/{$type}/{$task->id}/conversation";

            if ($type === 'project' && $task->websiteProject) {
                $sourceInfo = " on project '{$task->websiteProject->project_name}'";
            } elseif ($type === 'service' && $task->service) {
                $sourceInfo = " on service '{$task->service->service_name}'";
            } else {
                $code = $task->task_code ? " ({$task->task_code})" : '';
                $sourceInfo = "{$code}";
            }

            try {
                $employee->user->notify(new CrmNotification(
                    "New Task Assigned: {$task->task_title}",
                    "You have been assigned to task '{$task->task_title}'{$sourceInfo}.",
                    'task_assigned',
                    $task->priority === 'urgent' ? 'urgent' : ($task->priority === 'high' ? 'warning' : 'info'),
                    $actionUrl,
                    [
                        'task_id' => $task->id,
                        'type' => $type,
                        'task_code' => $task->task_code ?? null,
                    ]
                ));
            } catch (\Throwable $e) {
                Log::warning("Failed to dispatch in-app notification to user {$employee->user->id}: " . $e->getMessage());
            }
        }
    }

    /**
     * Send email and in-app notifications to assigned employee whenever their task is edited/updated.
     *
     * @param Task|ProjectTask|ServiceTask $task
     * @param string $type ('general'|'project'|'service')
     * @param array $changes Optional change metadata (e.g. ['status' => 'in_progress'])
     * @return void
     */
    public static function notifyTaskUpdated($task, string $type = 'general', array $changes = []): void
    {
        if (empty($task->assigned_employee_id)) {
            return;
        }

        // Eager load necessary relations
        if ($type === 'project') {
            $task->loadMissing(['websiteProject.client']);
        } elseif ($type === 'service') {
            $task->loadMissing(['service.client']);
        } elseif ($type === 'general') {
            $task->loadMissing(['taskCategory']);
        }

        $employee = Employee::with('user')->find($task->assigned_employee_id);
        if (!$employee) {
            return;
        }

        $updatedBy = Auth::user();

        // Do not notify self if the updater is the assigned employee themselves
        if ($updatedBy && $employee->user && $employee->user->id === $updatedBy->id) {
            return;
        }

        $sourceInfo = '';
        $actionUrl = "/my-tasks/task/{$type}/{$task->id}/conversation";

        if ($type === 'project' && $task->websiteProject) {
            $sourceInfo = " on project '{$task->websiteProject->project_name}'";
        } elseif ($type === 'service' && $task->service) {
            $sourceInfo = " on service '{$task->service->service_name}'";
        } else {
            $code = $task->task_code ? " ({$task->task_code})" : '';
            $sourceInfo = "{$code}";
        }

        $updaterName = $updatedBy ? $updatedBy->name : 'Administrator';

        $changeDesc = '';
        if (isset($changes['status'])) {
            $statusLabel = ucfirst(str_replace('_', ' ', $changes['status']));
            $changeDesc = " Status changed to {$statusLabel}.";
        } elseif (isset($changes['priority'])) {
            $priorityLabel = ucfirst($changes['priority']);
            $changeDesc = " Priority changed to {$priorityLabel}.";
        }

        // 1. Send Email Notification
        $recipientEmail = $employee->email ?: ($employee->user?->email ?? null);
        if (!empty($recipientEmail) && filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
            try {
                Mail::to($recipientEmail)->send(new TaskUpdatedMail(
                    $task,
                    $type,
                    $employee,
                    $updatedBy,
                    $changes
                ));
            } catch (\Throwable $e) {
                Log::warning("Failed to send task updated email to {$recipientEmail} for task ID {$task->id}: " . $e->getMessage());
            }
        }

        // 2. Send In-App CRM Database Notification
        if ($employee->user) {
            try {
                $employee->user->notify(new CrmNotification(
                    "Task Updated: {$task->task_title}",
                    "Task '{$task->task_title}'{$sourceInfo} has been updated by {$updaterName}.{$changeDesc}",
                    'task_updated',
                    $task->priority === 'urgent' ? 'urgent' : ($task->priority === 'high' ? 'warning' : 'info'),
                    $actionUrl,
                    [
                        'task_id' => $task->id,
                        'type' => $type,
                        'task_code' => $task->task_code ?? null,
                        'changes' => $changes,
                    ]
                ));
            } catch (\Throwable $e) {
                Log::warning("Failed to dispatch in-app task_updated notification to user {$employee->user->id}: " . $e->getMessage());
            }
        }
    }
}
