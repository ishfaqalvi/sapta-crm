<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Display the full notification center.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        if (!$user) {
            abort(401);
        }

        $filter = $request->query('filter', 'all');
        $search = $request->query('search');

        $query = $user->notifications();

        if ($filter === 'unread') {
            $query->whereNull('read_at');
        } elseif ($filter === 'read') {
            $query->whereNotNull('read_at');
        }

        if ($search) {
            $query->where('data', 'like', "%{$search}%");
        }

        $notifications = $query->paginate(20)->withQueryString();

        $unreadCount = $user->unreadNotifications()->count();
        $totalCount = $user->notifications()->count();

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
            'totalCount' => $totalCount,
            'filters' => [
                'filter' => $filter,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(string $id): RedirectResponse
    {
        $user = auth()->user();
        if ($user) {
            $notification = $user->notifications()->where('id', $id)->first();
            if ($notification && is_null($notification->read_at)) {
                $notification->markAsRead();
            }
        }

        return redirect()->back();
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(): RedirectResponse
    {
        $user = auth()->user();
        if ($user) {
            $user->unreadNotifications->markAsRead();
        }

        return redirect()->back()->with('success', 'All notifications marked as read.');
    }

    /**
     * Delete a single notification.
     */
    public function destroy(string $id): RedirectResponse
    {
        $user = auth()->user();
        if ($user) {
            $user->notifications()->where('id', $id)->delete();
        }

        return redirect()->back()->with('success', 'Notification removed.');
    }

    /**
     * Clear all notifications for the user.
     */
    public function clearAll(): RedirectResponse
    {
        $user = auth()->user();
        if ($user) {
            $user->notifications()->delete();
        }

        return redirect()->back()->with('success', 'All notifications cleared.');
    }
}
