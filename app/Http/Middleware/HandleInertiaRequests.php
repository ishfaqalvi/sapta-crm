<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();

        $unreadNotificationsCount = 0;
        $recentNotifications = [];

        if ($user) {
            $unreadNotificationsCount = $user->unreadNotifications()->count();
            $recentNotifications = $user->notifications()
                ->latest()
                ->take(8)
                ->get()
                ->map(function ($notification) {
                    $data = is_array($notification->data) ? $notification->data : (json_decode($notification->data, true) ?: []);
                    return [
                        'id' => $notification->id,
                        'title' => $data['title'] ?? 'System Notification',
                        'message' => $data['message'] ?? '',
                        'type' => $data['type'] ?? 'general',
                        'severity' => $data['severity'] ?? 'info',
                        'action_url' => $data['action_url'] ?? null,
                        'metadata' => $data['metadata'] ?? [],
                        'read_at' => $notification->read_at ? $notification->read_at->toIso8601String() : null,
                        'created_at' => $notification->created_at ? $notification->created_at->toIso8601String() : null,
                    ];
                })
                ->toArray();
        }

        return array_merge(parent::share($request), [
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'roles' => $user->getRoleNames()->toArray(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->toArray(),
                ]) : null,
                'unread_notifications_count' => $unreadNotificationsCount,
                'recent_notifications' => $recentNotifications,
            ],
            'flash' => [
                'success' => session('success') ?? session('status'),
                'error' => session('error'),
                'info' => session('info'),
                'warning' => session('warning'),
            ],
        ]);
    }
}
