<?php

namespace App\Console\Commands;

use App\Models\Client;
use App\Models\ClientDomain;
use App\Models\ClientHosting;
use App\Models\Invoice;
use App\Models\ProjectTask;
use App\Models\SystemSetting;
use App\Models\Task;
use App\Models\User;
use App\Notifications\CrmNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendDailyNotificationAlerts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'crm:send-daily-alerts';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scan database and send scheduled daily notification alerts based on configured CRM Settings thresholds';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Starting CRM Daily Notification Alerts Scan...');

        // 1. Load Dynamic Alert Thresholds from CRM Settings
        $domainFirstDays = (int) SystemSetting::get('domain_alert_first_days', 30);
        $domainUrgentDays = (int) SystemSetting::get('domain_alert_urgent_days', 7);

        $hostingFirstDays = (int) SystemSetting::get('hosting_alert_first_days', 15);
        $hostingUrgentDays = (int) SystemSetting::get('hosting_alert_urgent_days', 7);

        $invoiceDueDays = (int) SystemSetting::get('invoice_due_alert_days', 3);
        $taskDueDays = (int) SystemSetting::get('task_due_alert_days', 1);
        $dailyDigestEnabled = SystemSetting::get('daily_digest_enabled', '1') === '1';

        $superAdmins = User::whereHas('roles', fn($q) => $q->whereIn('name', ['Super Admin', 'super admin', 'super-admin']))->get();
        if ($superAdmins->isEmpty()) {
            $superAdmins = User::where('type', 'admin')->get();
        }

        $sentCount = 0;
        $today = Carbon::today();

        // -------------------------------------------------------------
        // 2. DOMAIN EXPIRY ALERTS
        // -------------------------------------------------------------
        $domains = ClientDomain::whereNotNull('expiry_date')
            ->where('status', '!=', 'cancelled')
            ->with('client')
            ->get();

        foreach ($domains as $domain) {
            $expiryDate = Carbon::parse($domain->expiry_date)->startOfDay();
            $daysLeft = $today->diffInDays($expiryDate, false);

            $severity = 'info';
            $triggerAlert = false;
            $alertLabel = '';

            if ($daysLeft === $domainFirstDays) {
                $triggerAlert = true;
                $severity = 'warning';
                $alertLabel = "expires in {$domainFirstDays} days";
            } elseif ($daysLeft === $domainUrgentDays) {
                $triggerAlert = true;
                $severity = 'urgent';
                $alertLabel = "URGENT: expires in {$domainUrgentDays} days";
            } elseif ($daysLeft === 0) {
                $triggerAlert = true;
                $severity = 'urgent';
                $alertLabel = "EXPIRES TODAY";
            } elseif ($daysLeft < 0 && $daysLeft >= -3) {
                $triggerAlert = true;
                $severity = 'urgent';
                $alertLabel = "HAS EXPIRED";
            }

            if ($triggerAlert) {
                $title = "Domain Expiry Alert: {$domain->domain_name}";
                $message = "The domain '{$domain->domain_name}' ({$domain->client?->name}) {$alertLabel} on {$expiryDate->format('M d, Y')}.";
                $actionUrl = '/reports';

                // Send to Client Users
                if ($domain->client_id) {
                    $clientUsers = User::where('client_id', $domain->client_id)->get();
                    foreach ($clientUsers as $clientUser) {
                        if (!$this->hasNotificationSentToday($clientUser, 'domain_expiry', $domain->id, $daysLeft)) {
                            $clientUser->notify(new CrmNotification($title, $message, 'domain_expiry', $severity, '/client/domains', [
                                'domain_id' => $domain->id,
                                'days_left' => $daysLeft,
                            ]));
                            $sentCount++;
                        }
                    }
                }

                // Send to Super Admins
                foreach ($superAdmins as $admin) {
                    if (!$this->hasNotificationSentToday($admin, 'domain_expiry', $domain->id, $daysLeft)) {
                        $admin->notify(new CrmNotification($title, $message, 'domain_expiry', $severity, $actionUrl, [
                            'domain_id' => $domain->id,
                            'days_left' => $daysLeft,
                        ]));
                        $sentCount++;
                    }
                }
            }
        }

        // -------------------------------------------------------------
        // 3. HOSTING RENEWAL ALERTS
        // -------------------------------------------------------------
        $hostings = ClientHosting::whereNotNull('expiry_date')
            ->where('status', '!=', 'cancelled')
            ->with('client')
            ->get();

        foreach ($hostings as $hosting) {
            $expiryDate = Carbon::parse($hosting->expiry_date)->startOfDay();
            $daysLeft = $today->diffInDays($expiryDate, false);

            $severity = 'info';
            $triggerAlert = false;
            $alertLabel = '';

            if ($daysLeft === $hostingFirstDays) {
                $triggerAlert = true;
                $severity = 'warning';
                $alertLabel = "renews in {$hostingFirstDays} days";
            } elseif ($daysLeft === $hostingUrgentDays) {
                $triggerAlert = true;
                $severity = 'urgent';
                $alertLabel = "URGENT: renews in {$hostingUrgentDays} days";
            } elseif ($daysLeft === 0) {
                $triggerAlert = true;
                $severity = 'urgent';
                $alertLabel = "RENEWAL DUE TODAY";
            } elseif ($daysLeft < 0 && $daysLeft >= -3) {
                $triggerAlert = true;
                $severity = 'urgent';
                $alertLabel = "IS OVERDUE";
            }

            if ($triggerAlert) {
                $title = "Hosting Renewal Alert: {$hosting->hosting_title}";
                $message = "Hosting package '{$hosting->hosting_title}' ({$hosting->client?->name}) {$alertLabel} on {$expiryDate->format('M d, Y')}.";
                $actionUrl = '/reports';

                // Send to Client Users
                if ($hosting->client_id) {
                    $clientUsers = User::where('client_id', $hosting->client_id)->get();
                    foreach ($clientUsers as $clientUser) {
                        if (!$this->hasNotificationSentToday($clientUser, 'hosting_expiry', $hosting->id, $daysLeft)) {
                            $clientUser->notify(new CrmNotification($title, $message, 'hosting_expiry', $severity, '/client/hostings', [
                                'hosting_id' => $hosting->id,
                                'days_left' => $daysLeft,
                            ]));
                            $sentCount++;
                        }
                    }
                }

                // Send to Super Admins
                foreach ($superAdmins as $admin) {
                    if (!$this->hasNotificationSentToday($admin, 'hosting_expiry', $hosting->id, $daysLeft)) {
                        $admin->notify(new CrmNotification($title, $message, 'hosting_expiry', $severity, $actionUrl, [
                            'hosting_id' => $hosting->id,
                            'days_left' => $daysLeft,
                        ]));
                        $sentCount++;
                    }
                }
            }
        }

        // -------------------------------------------------------------
        // 4. INVOICE DUE & OVERDUE ALERTS
        // -------------------------------------------------------------
        $unpaidInvoices = Invoice::whereNotIn('status', ['paid', 'cancelled', 'draft'])
            ->whereNotNull('due_date')
            ->with('client')
            ->get();

        foreach ($unpaidInvoices as $invoice) {
            $dueDate = Carbon::parse($invoice->due_date)->startOfDay();
            $daysLeft = $today->diffInDays($dueDate, false);

            $triggerAlert = false;
            $severity = 'info';
            $alertLabel = '';

            if ($daysLeft === $invoiceDueDays) {
                $triggerAlert = true;
                $severity = 'warning';
                $alertLabel = "is due in {$invoiceDueDays} days";
            } elseif ($daysLeft === 0) {
                $triggerAlert = true;
                $severity = 'urgent';
                $alertLabel = "is due TODAY";
            } elseif ($daysLeft < 0) {
                // Alert on 1st, 3rd, and 7th day overdue
                $daysOverdue = abs($daysLeft);
                if (in_array($daysOverdue, [1, 3, 7, 14])) {
                    $triggerAlert = true;
                    $severity = 'urgent';
                    $alertLabel = "is OVERDUE by {$daysOverdue} days";
                }
            }

            if ($triggerAlert) {
                $title = "Invoice Alert: #{$invoice->invoice_number}";
                $message = "Invoice #{$invoice->invoice_number} ({$invoice->currency_code} " . number_format($invoice->total_amount, 2) . ") {$alertLabel}.";

                // Notify Client
                if ($invoice->client_id) {
                    $clientUsers = User::where('client_id', $invoice->client_id)->get();
                    foreach ($clientUsers as $clientUser) {
                        if (!$this->hasNotificationSentToday($clientUser, 'invoice_due', $invoice->id, $daysLeft)) {
                            $clientUser->notify(new CrmNotification($title, $message, 'invoice_due', $severity, "/client/invoices/{$invoice->id}", [
                                'invoice_id' => $invoice->id,
                                'days_left' => $daysLeft,
                            ]));
                            $sentCount++;
                        }
                    }
                }

                // Notify Super Admins if overdue or due today
                if ($daysLeft <= 0) {
                    foreach ($superAdmins as $admin) {
                        if (!$this->hasNotificationSentToday($admin, 'invoice_overdue', $invoice->id, $daysLeft)) {
                            $admin->notify(new CrmNotification($title, $message, 'invoice_overdue', $severity, "/invoices/{$invoice->id}", [
                                'invoice_id' => $invoice->id,
                                'days_left' => $daysLeft,
                            ]));
                            $sentCount++;
                        }
                    }
                }
            }
        }

        // -------------------------------------------------------------
        // 5. TASKS DUE TODAY & OVERDUE ALERTS
        // -------------------------------------------------------------
        $tasks = Task::where('status', '!=', 'completed')
            ->whereNotNull('due_date')
            ->whereNotNull('assigned_employee_id')
            ->with(['assignedEmployee'])
            ->get();

        foreach ($tasks as $task) {
            $dueDate = Carbon::parse($task->due_date)->startOfDay();
            $daysLeft = $today->diffInDays($dueDate, false);

            $triggerAlert = false;
            $severity = 'info';
            $alertLabel = '';

            if ($daysLeft === $taskDueDays) {
                $triggerAlert = true;
                $severity = 'info';
                $alertLabel = "is due tomorrow";
            } elseif ($daysLeft === 0) {
                $triggerAlert = true;
                $severity = 'warning';
                $alertLabel = "is due TODAY";
            } elseif ($daysLeft < 0 && $daysLeft >= -3) {
                $triggerAlert = true;
                $severity = 'urgent';
                $alertLabel = "is OVERDUE by " . abs($daysLeft) . " day(s)";
            }

            if ($triggerAlert && $task->assigned_employee_id) {
                $employeeUser = User::where('employee_id', $task->assigned_employee_id)->first();
                if ($employeeUser) {
                    if (!$this->hasNotificationSentToday($employeeUser, 'task_due', $task->id, $daysLeft)) {
                        $title = "Task Deadline Alert: {$task->task_title}";
                        $message = "Your assigned task '{$task->task_title}' {$alertLabel} ({$dueDate->format('M d, Y')}).";

                        $employeeUser->notify(new CrmNotification($title, $message, 'task_due', $severity, "/tasks", [
                            'task_id' => $task->id,
                            'days_left' => $daysLeft,
                        ]));
                        $sentCount++;
                    }
                }
            }
        }

        // -------------------------------------------------------------
        // 6. EXECUTIVE DAILY DIGEST FOR SUPER ADMINS
        // -------------------------------------------------------------
        if ($dailyDigestEnabled && $superAdmins->isNotEmpty()) {
            $expiringDomainsCount = ClientDomain::whereNotNull('expiry_date')
                ->whereBetween('expiry_date', [now(), now()->addDays(7)])
                ->count();

            $expiringHostingsCount = ClientHosting::whereNotNull('expiry_date')
                ->whereBetween('expiry_date', [now(), now()->addDays(7)])
                ->count();

            $overdueInvoicesCount = Invoice::whereNotIn('status', ['paid', 'cancelled', 'draft'])
                ->where('due_date', '<', now())
                ->count();

            $tasksDueTodayCount = Task::where('status', '!=', 'completed')
                ->whereDate('due_date', now())
                ->count();

            if ($expiringDomainsCount > 0 || $expiringHostingsCount > 0 || $overdueInvoicesCount > 0 || $tasksDueTodayCount > 0) {
                $digestTitle = "Daily Operations & Financial Briefing";
                $digestMessage = "Today: {$expiringDomainsCount} domain(s) expiring in 7 days, {$expiringHostingsCount} hosting(s) due, {$overdueInvoicesCount} overdue invoice(s), {$tasksDueTodayCount} task(s) due today.";

                foreach ($superAdmins as $admin) {
                    if (!$this->hasNotificationSentToday($admin, 'daily_digest', 0, 0)) {
                        $admin->notify(new CrmNotification($digestTitle, $digestMessage, 'daily_digest', 'info', '/dashboard', [
                            'domains' => $expiringDomainsCount,
                            'hostings' => $expiringHostingsCount,
                            'invoices' => $overdueInvoicesCount,
                            'tasks' => $tasksDueTodayCount,
                        ]));
                        $sentCount++;
                    }
                }
            }
        }

        $this->info("CRM Daily Notification Alerts Scan completed. Total notifications dispatched: {$sentCount}");
        return Command::SUCCESS;
    }

    /**
     * Check if a notification for the same item and state was already dispatched to this user today.
     */
    private function hasNotificationSentToday(User $user, string $type, int $itemId, int $daysLeft): bool
    {
        return DB::table('notifications')
            ->where('notifiable_type', User::class)
            ->where('notifiable_id', $user->id)
            ->whereDate('created_at', Carbon::today())
            ->where('data', 'like', "%\"type\":\"{$type}\"%")
            ->where(function ($q) use ($itemId, $daysLeft) {
                if ($itemId > 0) {
                    $q->where('data', 'like', "%\"days_left\":{$daysLeft}%");
                }
            })
            ->exists();
    }
}
