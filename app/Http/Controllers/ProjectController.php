<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ProjectCategory;
use App\Models\WebsiteProject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Display a listing of Website Projects across clients (Read-Only).
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-projects') && !$user->can('view-projects'))) {
            abort(403, 'Unauthorized. You do not have permission to view projects.');
        }

        $search = $request->query('search');
        $status = $request->query('status');
        $clientId = $request->query('client_id');
        $categoryId = $request->query('category_id');

        $query = WebsiteProject::with([
            'client:id,name,company_name,client_code,email,status',
            'category:id,name',
        ])
        ->withCount('tasks')
        ->when($search, function ($q, $search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('project_name', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%")
                    ->orWhereHas('client', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%")
                           ->orWhere('client_code', 'like', "%{$search}%")
                           ->orWhere('company_name', 'like', "%{$search}%");
                    });
            });
        })
        ->when($status, function ($q, $status) {
            $q->where('status', $status);
        })
        ->when($clientId, function ($q, $clientId) {
            $q->where('client_id', $clientId);
        })
        ->when($categoryId, function ($q, $categoryId) {
            $q->where('category_id', $categoryId);
        });

        $projects = $query->latest('id')
            ->paginate(12)
            ->withQueryString()
            ->through(function ($proj) {
                return [
                    'id' => $proj->id,
                    'client_id' => $proj->client_id,
                    'project_name' => $proj->project_name,
                    'category' => $proj->category ? [
                        'id' => $proj->category->id,
                        'name' => $proj->category->name,
                    ] : null,
                    'client' => $proj->client ? [
                        'id' => $proj->client->id,
                        'name' => $proj->client->name,
                        'company_name' => $proj->client->company_name,
                        'client_code' => $proj->client->client_code,
                    ] : null,
                    'start_date' => $proj->start_date ? $proj->start_date->format('d M Y') : null,
                    'deadline' => $proj->deadline ? $proj->deadline->format('d M Y') : null,
                    'status' => $proj->status,
                    'progress_percentage' => $proj->progress_percentage ?? 0,
                    'tasks_count' => $proj->tasks_count ?? 0,
                    'created_at' => $proj->created_at ? $proj->created_at->format('d M Y') : null,
                ];
            });

        // Operational stats (strictly non-financial)
        $stats = [
            'total' => WebsiteProject::count(),
            'in_progress' => WebsiteProject::where('status', 'in_progress')->count(),
            'on_hold' => WebsiteProject::where('status', 'on_hold')->count(),
            'completed' => WebsiteProject::where('status', 'completed')->count(),
            'cancelled' => WebsiteProject::where('status', 'cancelled')->count(),
        ];

        $clients = Client::select('id', 'name', 'client_code', 'company_name')->orderBy('name')->get();
        $categories = ProjectCategory::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('projects/index', [
            'projects' => $projects,
            'stats' => $stats,
            'clients' => $clients,
            'categories' => $categories,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status ?? '',
                'client_id' => $clientId ?? '',
                'category_id' => $categoryId ?? '',
            ],
        ]);
    }

    /**
     * Display the specified Website Project details with tabbed workspace (Read-Only).
     */
    public function show(WebsiteProject $project): Response
    {
        $user = auth()->user();
        if (!$user || (!$user->hasRole('Super Admin') && !$user->hasPermissionTo('view-projects') && !$user->can('view-projects'))) {
            abort(403, 'Unauthorized. You do not have permission to view projects.');
        }

        $isSuperAdmin = $user->hasRole('Super Admin');

        // Check granular tab permissions
        $canViewMilestones = $isSuperAdmin || $user->hasPermissionTo('view-project-milestones') || $user->can('view-project-milestones');
        $canViewTasks = $isSuperAdmin || $user->hasPermissionTo('view-project-tasks') || $user->can('view-project-tasks');
        $canViewCredentials = $isSuperAdmin || $user->hasPermissionTo('view-project-credentials') || $user->can('view-project-credentials');
        $canViewDocuments = $isSuperAdmin || $user->hasPermissionTo('view-project-documents') || $user->can('view-project-documents');

        $project->load([
            'client:id,name,company_name,client_code,email,phone,city,country,status',
            'category:id,name',
        ]);

        if ($canViewMilestones) {
            $project->load([
                'payments' => function ($q) {
                    $q->orderBy('created_at', 'asc');
                },
            ]);
        }

        if ($canViewTasks) {
            $project->load([
                'tasks' => function ($q) {
                    $q->with('assignedEmployee:id,name,employee_code,avatar')
                      ->withCount('messages')
                      ->orderBy('due_date', 'asc');
                },
            ]);
        }

        if ($canViewCredentials) {
            $project->load([
                'credentials' => function ($q) {
                    $q->orderBy('created_at', 'desc');
                },
            ]);
        }

        if ($canViewDocuments) {
            $project->load([
                'documents' => function ($q) {
                    $q->orderBy('created_at', 'desc');
                },
            ]);
        }

        // Format project data safely without financial figures
        $projectData = [
            'id' => $project->id,
            'client_id' => $project->client_id,
            'project_name' => $project->project_name,
            'category' => $project->category,
            'client' => $project->client,
            'start_date' => $project->start_date ? $project->start_date->format('d M Y') : null,
            'deadline' => $project->deadline ? $project->deadline->format('d M Y') : null,
            'status' => $project->status,
            'progress_percentage' => $project->progress_percentage ?? 0,
            'notes' => $project->notes,
            'created_at' => $project->created_at ? $project->created_at->format('d M Y') : null,
            'milestones' => $canViewMilestones ? ($project->payments->map(function ($m) {
                return [
                    'id' => $m->id,
                    'milestone_name' => $m->milestone_name ?? 'Milestone',
                    'due_date' => $m->due_date ? $m->due_date->format('d M Y') : null,
                    'status' => $m->status,
                    'notes' => $m->notes,
                ];
            })) : [],
            'tasks' => $canViewTasks ? ($project->tasks->map(function ($t) {
                return [
                    'id' => $t->id,
                    'task_title' => $t->task_title,
                    'task_description' => $t->task_description,
                    'priority' => $t->priority,
                    'status' => $t->status,
                    'start_date' => $t->start_date ? $t->start_date->format('d M Y') : null,
                    'due_date' => $t->due_date ? $t->due_date->format('d M Y') : null,
                    'assigned_employee' => $t->assignedEmployee,
                    'messages_count' => $t->messages_count ?? 0,
                ];
            })) : [],
            'credentials' => $canViewCredentials ? $project->credentials : [],
            'documents' => $canViewDocuments ? ($project->documents->map(function ($d) {
                return [
                    'id' => $d->id,
                    'title' => $d->title,
                    'file_path' => $d->file_path,
                    'file_name' => $d->file_name,
                    'file_type' => $d->file_type,
                    'file_size' => $d->file_size,
                    'created_at' => $d->created_at ? $d->created_at->format('d M Y, h:i A') : null,
                    'updated_at' => $d->updated_at ? $d->updated_at->format('d M Y, h:i A') : null,
                ];
            })) : [],
        ];

        return Inertia::render('projects/show', [
            'project' => $projectData,
            'permissions' => [
                'view_milestones' => $canViewMilestones,
                'view_tasks' => $canViewTasks,
                'view_credentials' => $canViewCredentials,
                'view_documents' => $canViewDocuments,
            ],
        ]);
    }
}
