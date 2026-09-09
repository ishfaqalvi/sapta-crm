<?php

namespace App\Services;

use App\Mail\TaskAssignedMail;
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
            $actionUrl = '/tasks';

            if ($type === 'project' && $task->websiteProject) {
                $sourceInfo = " on project '{$task->websiteProject->project_name}'";
                $actionUrl = "/tasks/detail/project/{$task->id}";
            } elseif ($type === 'service' && $task->service) {
                $sourceInfo = " on service '{$task->service->service_name}'";
                $actionUrl = "/tasks/detail/service/{$task->id}";
            } else {
                $code = $task->task_code ? " ({$task->task_code})" : '';
                $sourceInfo = "{$code}";
                $actionUrl = "/tasks/detail/general/{$task->id}";
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
}
