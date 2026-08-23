<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class CrmNotification extends Notification
{
    use Queueable;

    public string $title;
    public string $message;
    public string $type;
    public string $severity;
    public ?string $actionUrl;
    public array $metadata;

    /**
     * Create a new notification instance.
     *
     * @param string $title
     * @param string $message
     * @param string $type
     * @param string $severity ('info' | 'success' | 'warning' | 'urgent')
     * @param string|null $actionUrl
     * @param array $metadata
     */
    public function __construct(
        string $title,
        string $message,
        string $type = 'general',
        string $severity = 'info',
        ?string $actionUrl = null,
        array $metadata = []
    ) {
        $this->title = $title;
        $this->message = $message;
        $this->type = $type;
        $this->severity = in_array($severity, ['info', 'success', 'warning', 'urgent']) ? $severity : 'info';
        $this->actionUrl = $actionUrl;
        $this->metadata = $metadata;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'severity' => $this->severity,
            'action_url' => $this->actionUrl,
            'metadata' => $this->metadata,
            'created_at' => now()->toIso8601String(),
        ];
    }
}
