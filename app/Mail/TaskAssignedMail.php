<?php

namespace App\Mail;

use App\Models\Employee;
use App\Models\ProjectTask;
use App\Models\ServiceTask;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TaskAssignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $task;
    public string $taskType;
    public Employee $employee;
    public ?User $assignedBy;
    public array $details;

    /**
     * Create a new message instance.
     *
     * @param Task|ProjectTask|ServiceTask $task
     * @param string $taskType ('general'|'project'|'service')
     * @param Employee $employee
     * @param User|null $assignedBy
     */
    public function __construct($task, string $taskType, Employee $employee, ?User $assignedBy = null)
    {
        $this->task = $task;
        $this->taskType = $taskType;
        $this->employee = $employee;
        $this->assignedBy = $assignedBy;

        $this->details = $this->buildDetails();
    }

    /**
     * Build detailed structured metadata for the email template.
     */
    protected function buildDetails(): array
    {
        $typeLabel = 'General Task';
        $sourceTitle = 'General';
        $clientName = null;
        $taskCode = $this->task->task_code ?? ('#' . $this->task->id);

        if ($this->taskType === 'project') {
            $typeLabel = 'Project Task';
            $project = $this->task->websiteProject;
            $sourceTitle = $project ? $project->project_name : 'Website Project';
            $clientName = $project?->client ? ($project->client->company_name ?: $project->client->name) : null;
        } elseif ($this->taskType === 'service') {
            $typeLabel = 'Service Task';
            $service = $this->task->service;
            $sourceTitle = $service ? $service->service_name : 'Client Service';
            $clientName = $service?->client ? ($service->client->company_name ?: $service->client->name) : null;
        } else {
            $typeLabel = 'General Task';
            $sourceTitle = $this->task->taskCategory ? $this->task->taskCategory->name : 'General Operations';
        }

        $startDateFormatted = $this->task->start_date
            ? Carbon::parse($this->task->start_date)->format('M d, Y')
            : null;

        $dueDateFormatted = $this->task->due_date
            ? Carbon::parse($this->task->due_date)->format('M d, Y')
            : null;

        $priorityColors = [
            'urgent' => ['bg' => '#fee2e2', 'text' => '#991b1b', 'border' => '#f87171'],
            'high' => ['bg' => '#ffedd5', 'text' => '#9a3412', 'border' => '#fb923c'],
            'medium' => ['bg' => '#fef3c7', 'text' => '#92400e', 'border' => '#fcd34d'],
            'low' => ['bg' => '#f1f5f9', 'text' => '#475569', 'border' => '#cbd5e1'],
        ];

        $priorityKey = strtolower($this->task->priority ?? 'medium');
        $priorityStyle = $priorityColors[$priorityKey] ?? $priorityColors['medium'];

        $attachmentUrl = null;
        if (!empty($this->task->attachment)) {
            $cleanAttachment = ltrim($this->task->attachment, '/\\');
            $attachmentUrl = str_starts_with($this->task->attachment, 'http')
                ? $this->task->attachment
                : url($cleanAttachment);
        }

        return [
            'type_label' => $typeLabel,
            'source_title' => $sourceTitle,
            'client_name' => $clientName,
            'task_code' => $taskCode,
            'task_title' => $this->task->task_title,
            'priority' => ucfirst($this->task->priority ?? 'Medium'),
            'priority_style' => $priorityStyle,
            'status' => ucfirst(str_replace('_', ' ', $this->task->status ?? 'Todo')),
            'start_date' => $startDateFormatted,
            'due_date' => $dueDateFormatted,
            'description' => $this->task->description,
            'attachment_name' => $this->task->attachment_name,
            'attachment_url' => $attachmentUrl,
            'action_url' => url('/my-tasks'),
            'assigned_by_name' => $this->assignedBy ? $this->assignedBy->name : 'Administrator',
            'employee_name' => $this->employee->name,
        ];
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = match ($this->taskType) {
            'project' => "New Task Assigned: {$this->details['task_title']} ({$this->details['source_title']})",
            'service' => "New Task Assigned: {$this->details['task_title']} ({$this->details['source_title']})",
            default => "New Task Assigned: {$this->details['task_title']} ({$this->details['task_code']})",
        };

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.task-assigned',
            with: [
                'details' => $this->details,
                'employee' => $this->employee,
                'task' => $this->task,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        $attachments = [];
        if (!empty($this->task->attachment)) {
            $cleanPath = ltrim($this->task->attachment, '/\\');
            $fullPath = public_path($cleanPath);
            if (file_exists($fullPath) && is_file($fullPath)) {
                $attachment = Attachment::fromPath($fullPath);
                if (!empty($this->task->attachment_name)) {
                    $attachment->as($this->task->attachment_name);
                }
                $attachments[] = $attachment;
            }
        }
        return $attachments;
    }
}
