import ClientPortalLayout from '@/layouts/client-portal-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowUpRight,
    BadgeCheck,
    BadgeDollarSign,
    BarChart2,
    Building2,
    Calendar,
    CheckCircle2,
    CheckSquare,
    Clock,
    CreditCard,
    DollarSign,
    Download,
    Edit3,
    ExternalLink,
    FileText,
    FolderKanban,
    Globe,
    Hash,
    Layers,
    LineChart,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
    PieChart as PieIcon,
    Receipt,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    User,
    Users,
    Zap,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface TaskEmployee {
    id: number;
    name: string;
    employee_code: string;
    avatar?: string;
}

interface ProjectTaskData {
    id: number;
    website_project_id: number;
    task_title: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date?: string;
    due_date?: string;
    description?: string;
    assigned_employee?: TaskEmployee;
}

interface ProjectPaymentData {
    id: number;
    website_project_id: number;
    milestone_title: string;
    amount: number | string;
    payment_stage: 'advance' | 'partial' | 'full';
    status: 'pending' | 'paid';
    paid_at?: string;
    payment_method?: string;
    website_project?: {
        id: number;
        project_name: string;
    };
}

interface WebsiteProjectItem {
    id: number;
    project_name: string;
    total_budget: number | string;
    currency: string;
    start_date?: string;
    deadline?: string;
    status: 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    progress_percentage: number;
    notes?: string;
    payments?: ProjectPaymentData[];
    tasks?: ProjectTaskData[];
}

interface SeoRetainerItem {
    id: number;
    monthly_amount: number | string;
    currency: string;
    status: 'active' | 'paused' | 'cancelled';
    billing_cycle_day: number;
    start_date?: string;
}

interface ClientDetailItem {
    id: number;
    client_code: string;
    name: string;
    company_name?: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    city?: string;
    country?: string;
    currency: string;
    status: 'active' | 'inactive';
    notes?: string;
    created_at: string;
    website_projects?: WebsiteProjectItem[];
    seo_retainers?: SeoRetainerItem[];
    project_payments?: ProjectPaymentData[];
}

interface ClientPortalOverviewProps {
    client: ClientDetailItem;
}

export default function ClientPortalOverview({ client }: ClientPortalOverviewProps) {
    const page = usePage();
    const authUser = (page.props.auth as any)?.user;
    const isAdmin = authUser?.type === 'admin';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Client Portal', href: '/client-portal/overview' },
        { title: `${client.name} Overview`, href: '/client-portal/overview' },
    ];

    const formatCurrency = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return (num || 0).toLocaleString('en-US', {
            style: 'currency',
            currency: client.currency || 'USD',
            maximumFractionDigits: 0,
        });
    };

    // Calculate Financial & Metrics Summary
    const activeProjects = client.website_projects?.filter((p) => p.status === 'in_progress') || [];
    const activeSeoRetainers = client.seo_retainers?.filter((r) => r.status === 'active') || [];

    const totalProjectBudget = client.website_projects?.reduce((acc, p) => acc + (parseFloat(p.total_budget as string) || 0), 0) || 0;

    let totalPaid = 0;
    let allPayments: ProjectPaymentData[] = [];
    let allTasks: ProjectTaskData[] = [];

    client.website_projects?.forEach((p) => {
        if (p.payments) {
            allPayments = [...allPayments, ...p.payments];
            p.payments.forEach((pay) => {
                if (pay.status === 'paid') {
                    totalPaid += parseFloat(pay.amount as string) || 0;
                }
            });
        }
        if (p.tasks) {
            allTasks = [...allTasks, ...p.tasks];
        }
    });

    const pendingBalance = Math.max(0, totalProjectBudget - totalPaid);
    const paymentProgress = totalProjectBudget > 0 ? Math.min(100, Math.round((totalPaid / totalProjectBudget) * 100)) : 0;
    const completedTasksCount = allTasks.filter((t) => t.status === 'completed').length;

    // Chart Data 1: Task Deliverables Distribution (Donut Chart)
    const taskStatusCounts = {
        completed: allTasks.filter((t) => t.status === 'completed').length,
        in_progress: allTasks.filter((t) => t.status === 'in_progress').length,
        in_review: allTasks.filter((t) => t.status === 'in_review').length,
        todo: allTasks.filter((t) => t.status === 'todo' || t.status === 'cancelled').length,
    };

    const taskPieData = [
        { name: 'Completed', value: taskStatusCounts.completed, color: '#10b981' },
        { name: 'In Progress', value: taskStatusCounts.in_progress, color: '#3b82f6' },
        { name: 'In Review', value: taskStatusCounts.in_review, color: '#8b5cf6' },
        { name: 'To Do / Pending', value: taskStatusCounts.todo, color: '#f59e0b' },
    ].filter((d) => d.value > 0);

    // Chart Data 2: Project Budget vs Paid Breakdown
    const projectInvestmentData = (client.website_projects || []).map((proj) => {
        const projPaid = (proj.payments || [])
            .filter((p) => p.status === 'paid')
            .reduce((sum, p) => sum + (parseFloat(p.amount as string) || 0), 0);
        const budget = parseFloat(proj.total_budget as string) || 0;
        return {
            name: proj.project_name.length > 18 ? proj.project_name.substring(0, 16) + '...' : proj.project_name,
            Budget: budget,
            Cleared: projPaid,
            Pending: Math.max(0, budget - projPaid),
        };
    });

    return (
        <ClientPortalLayout client={client} breadcrumbs={breadcrumbs} activeTab="overview">
            <Head title={`${client.name} | Overview & Portal Dashboard`} />

            <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto space-y-6 sm:space-y-8 min-h-screen">
                {/* 1. Executive Multi-Gradient Hero Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b132b] via-[#1c2541] to-[#0b132b] text-white p-6 md:p-8 shadow-2xl border border-indigo-900/40">
                    {/* Ambient Glow Orbs */}
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 size-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute left-1/3 bottom-0 size-60 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute right-1/4 bottom-0 size-44 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="flex items-start md:items-center gap-4 md:gap-6">
                            <div className="relative size-16 md:size-20 rounded-2xl bg-gradient-to-tr from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white font-black text-2xl md:text-3xl flex items-center justify-center shadow-xl shadow-blue-500/30 shrink-0 border-2 border-white/25">
                                {client.name.charAt(0).toUpperCase()}
                                <span className="absolute -bottom-1 -right-1 flex size-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full size-4 bg-emerald-500 ring-2 ring-slate-950"></span>
                                </span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-sm">{client.name}</h1>
                                    <span className="px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-mono font-bold border border-white/15 backdrop-blur-md shadow-2xs">
                                        {client.client_code}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md ${client.status === 'active'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                                        }`}>
                                        <Sparkles className="size-3 text-emerald-400 animate-pulse" />
                                        <span>{client.status} Account</span>
                                    </span>
                                </div>

                                <p className="text-slate-300 text-xs md:text-sm font-medium flex flex-wrap items-center gap-2">
                                    <Building2 className="size-4 text-blue-400 shrink-0" />
                                    <span className="font-semibold text-white">{client.company_name || client.name}</span>
                                    {client.city && (
                                        <>
                                            <span className="text-slate-500">•</span>
                                            <span className="flex items-center gap-1 text-slate-300">
                                                <MapPin className="size-3.5 text-rose-400" />
                                                {[client.city, client.country].filter(Boolean).join(', ')}
                                            </span>
                                        </>
                                    )}
                                    <span className="text-slate-500">•</span>
                                    <span className="text-indigo-300 font-semibold flex items-center gap-1">
                                        <CreditCard className="size-3.5 text-purple-400" />
                                        Currency: {client.currency}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Banner Quick Actions */}
                        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto pt-4 lg:pt-0 border-t border-white/10 lg:border-0 w-full lg:w-auto">
                            <Link
                                href="/client-portal/invoices"
                                className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <Receipt className="size-4" />
                                <span>Invoices & Billing</span>
                            </Link>

                            <Link
                                href="/client-portal/projects"
                                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/15 backdrop-blur-md hover:-translate-y-0.5 active:translate-y-0"
                            >
                                <Globe className="size-4 text-cyan-300" />
                                <span>View Projects</span>
                            </Link>

                            {isAdmin ? (
                                <Link
                                    href={`/clients/edit/${client.id}`}
                                    className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-2 border border-slate-700 hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    <Edit3 className="size-4 text-indigo-300" />
                                    <span>Edit Client</span>
                                </Link>
                            ) : (
                                <Link
                                    href="/client-portal/profile"
                                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/15 backdrop-blur-md hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    <User className="size-4 text-purple-300" />
                                    <span>Profile Settings</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. Key KPI Metric Cards Grid (4 Vibrant & Glassmorphic Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {/* Card 1: Total Contract Budget */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 space-y-3 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Total Contract</span>
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                                <DollarSign className="size-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                                {formatCurrency(totalProjectBudget)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                                <span className="p-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                    <FolderKanban className="size-3" />
                                </span>
                                <span>{client.website_projects?.length || 0} Projects Total</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Cleared Receipts */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 space-y-3 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Cleared Receipts</span>
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                                <BadgeDollarSign className="size-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
                                {formatCurrency(totalPaid)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                                    {paymentProgress}%
                                </span>
                                <span>Budget Cleared</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Pending Balance */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 space-y-3 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-orange-500" />
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Pending Balance</span>
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform">
                                <Receipt className="size-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                                {formatCurrency(pendingBalance)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                                <span className="p-1 rounded bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                                    <Clock className="size-3" />
                                </span>
                                <span>Milestones Due</span>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Active Services & Retainers */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 space-y-3 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-violet-500 to-indigo-500" />
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Active Services</span>
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-md shadow-purple-500/25 group-hover:scale-105 transition-transform">
                                <LineChart className="size-5" />
                            </div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                {activeProjects.length + activeSeoRetainers.length} Active
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
                                    {activeProjects.length} Web • {activeSeoRetainers.length} SEO
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Colorful Interactive Recharts Visualizations Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* Visual 1: Project Investment & Clearance Breakdown (Bar Chart - Left 2 Columns) */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20">
                                    <BarChart2 className="size-5" />
                                </div>
                                <div>
                                    <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Project Financial Breakdown</h2>
                                    <p className="text-xs text-slate-400 font-medium">Budget vs Cleared Payment Comparison</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                    <span className="size-2.5 rounded-full bg-indigo-600 inline-block shadow-xs" /> Total Budget
                                </span>
                                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <span className="size-2.5 rounded-full bg-emerald-500 inline-block shadow-xs" /> Cleared Paid
                                </span>
                            </div>
                        </div>

                        {projectInvestmentData.length > 0 ? (
                            <div className="h-64 sm:h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={projectInvestmentData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="budgetGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.8} />
                                            </linearGradient>
                                            <linearGradient id="clearedGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3341551a" />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                borderColor: '#1e293b',
                                                borderRadius: '12px',
                                                color: '#fff',
                                                fontSize: '12px',
                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                                            }}
                                            formatter={(val: any) => [formatCurrency(val), 'Amount']}
                                        />
                                        <Bar dataKey="Budget" fill="url(#budgetGrad)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                                        <Bar dataKey="Cleared" fill="url(#clearedGrad)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm italic">
                                <BarChart2 className="size-10 mb-2 opacity-30 text-indigo-500" />
                                No project investment data available yet.
                            </div>
                        )}
                    </div>

                    {/* Visual 2: Deliverable Tasks Breakdown (Donut Pie Chart - Right 1 Column) */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-600/20">
                                <PieIcon className="size-5" />
                            </div>
                            <div>
                                <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Sprint Deliverables</h2>
                                <p className="text-xs text-slate-400 font-medium">Task Progress Breakdown</p>
                            </div>
                        </div>

                        {allTasks.length > 0 ? (
                            <div className="space-y-4">
                                <div className="h-48 w-full relative flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={taskPieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={75}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {taskPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#0f172a',
                                                    borderColor: '#1e293b',
                                                    borderRadius: '10px',
                                                    color: '#fff',
                                                    fontSize: '11px',
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    {/* Central Metric Indicator */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xl font-black text-slate-900 dark:text-white">{completedTasksCount}/{allTasks.length}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completed</span>
                                    </div>
                                </div>

                                {/* Custom Color Legend Grid */}
                                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/70">
                                    {taskPieData.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="size-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                                            </div>
                                            <span className="text-xs font-mono font-black text-slate-900 dark:text-white">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm italic">
                                <CheckSquare className="size-10 mb-2 opacity-30 text-blue-500" />
                                No deliverables recorded yet.
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Main Dashboard Layout (2 Columns: Left 2/3, Right 1/3) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                    {/* Left Column: Website Projects & Task Deliverables */}
                    <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                        {/* Website Projects Showcase Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20">
                                        <Globe className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Website Projects Showcase</h2>
                                        <p className="text-xs text-slate-400 font-medium">Active development status & milestone timelines</p>
                                    </div>
                                </div>
                                <Link
                                    href="/client-portal/projects"
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    <span>All Projects</span>
                                    <ArrowUpRight className="size-3.5" />
                                </Link>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {client.website_projects && client.website_projects.length > 0 ? (
                                    client.website_projects.map((project) => (
                                        <div key={project.id} className="p-6 space-y-4 hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                            {project.project_name}
                                                        </h3>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-slate-400 font-medium">
                                                        <span>Budget: <strong className="text-slate-800 dark:text-slate-200 font-bold">{formatCurrency(project.total_budget)}</strong></span>
                                                        {project.start_date && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="size-3.5 text-blue-500" />
                                                                Started: {project.start_date}
                                                            </span>
                                                        )}
                                                        {project.deadline && (
                                                            <span className="flex items-center gap-1 text-slate-500 font-bold">
                                                                <Clock className="size-3.5 text-amber-500" />
                                                                Deadline: {project.deadline}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <span className={`px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider self-start sm:self-auto shrink-0 ${project.status === 'in_progress'
                                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                                    : project.status === 'completed'
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                                    }`}>
                                                    {project.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {/* Multi-Color Progress Bar */}
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                                    <span className="flex items-center gap-1 text-slate-400">
                                                        <Activity className="size-3.5 text-blue-500" /> Completion Progress
                                                    </span>
                                                    <span className="text-blue-600 dark:text-blue-400 font-mono">{project.progress_percentage}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm"
                                                        style={{ width: `${project.progress_percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400 italic text-sm">
                                        No website development projects recorded for this account.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Deliverables & Tasks Feed */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20">
                                        <CheckSquare className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Project Deliverables Feed</h2>
                                        <p className="text-xs text-slate-400 font-medium">Sprint tasks & milestone progress</p>
                                    </div>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    {completedTasksCount} / {allTasks.length} Done
                                </span>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {allTasks.length > 0 ? (
                                    allTasks.slice(0, 6).map((task) => (
                                        <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`p-2 rounded-xl shrink-0 ${task.status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                    : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                                                    }`}>
                                                    <CheckCircle2 className="size-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                        {task.task_title}
                                                    </h4>
                                                    {task.assigned_employee && (
                                                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                                                            Assigned: {task.assigned_employee.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${task.priority === 'urgent' || task.priority === 'high'
                                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${task.status === 'completed'
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                    : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                                    }`}>
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400 italic text-sm">
                                        No active tasks linked to current projects.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Transactions & Payment Receipts Feed */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
                                        <Receipt className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Recent Payment Receipts</h2>
                                        <p className="text-xs text-slate-400 font-medium">Milestone transaction log</p>
                                    </div>
                                </div>
                                <Link
                                    href="/client-portal/invoices"
                                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                                >
                                    <span>All Statements</span>
                                    <ArrowUpRight className="size-3.5" />
                                </Link>
                            </div>

                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {allPayments.length > 0 ? (
                                    allPayments.slice(0, 5).map((payment) => (
                                        <div key={payment.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`p-2.5 rounded-xl shrink-0 ${payment.status === 'paid'
                                                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                    : 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                                                    }`}>
                                                    <BadgeDollarSign className="size-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                        {payment.milestone_title}
                                                    </h4>
                                                    <span className="text-[11px] text-slate-400 block font-medium mt-0.5">
                                                        Stage: <strong className="capitalize text-slate-700 dark:text-slate-300">{payment.payment_stage}</strong>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className="text-xs font-black font-mono text-slate-900 dark:text-white">
                                                    {formatCurrency(payment.amount)}
                                                </div>
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase mt-0.5 ${payment.status === 'paid'
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                    }`}>
                                                    {payment.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400 italic text-sm">
                                        No recent payment records found.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Clean Customer Profile, SEO Retainers & Support */}
                    <div className="space-y-6 sm:space-y-8">
                        {/* Elegant & Clean Customer Details Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                        <Building2 className="size-4" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Customer Details</h3>
                                </div>
                                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                                    {client.client_code}
                                </span>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100/80 dark:border-slate-800/60">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                        <User className="size-3.5 text-indigo-500" /> Primary Contact
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">{client.contact_person || client.name}</span>
                                </div>

                                {client.email && (
                                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100/80 dark:border-slate-800/60">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                            <Mail className="size-3.5 text-blue-500" /> Email Address
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[160px]">{client.email}</span>
                                    </div>
                                )}

                                {(client.phone || client.mobile) && (
                                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100/80 dark:border-slate-800/60">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                            <Phone className="size-3.5 text-emerald-500" /> Phone
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-slate-100">{client.phone || client.mobile}</span>
                                    </div>
                                )}

                                {(client.city || client.country) && (
                                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100/80 dark:border-slate-800/60">
                                        <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                            <MapPin className="size-3.5 text-rose-500" /> Location
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-slate-100">{[client.city, client.country].filter(Boolean).join(', ')}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100/80 dark:border-slate-800/60">
                                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                                        <CreditCard className="size-3.5 text-purple-500" /> Currency
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono uppercase">{client.currency}</span>
                                </div>
                            </div>
                        </div>

                        {/* Active SEO Retainers Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20">
                                        <LineChart className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="font-extrabold text-slate-900 dark:text-white text-base">SEO Retainers</h2>
                                        <p className="text-xs text-slate-400 font-medium">Active Subscriptions</p>
                                    </div>
                                </div>
                                <Link
                                    href="/client-portal/services"
                                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                                >
                                    Manage
                                </Link>
                            </div>

                            {client.seo_retainers && client.seo_retainers.length > 0 ? (
                                client.seo_retainers.map((retainer) => (
                                    <div key={retainer.id} className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/5 via-slate-50 to-purple-500/5 dark:from-purple-950/20 dark:via-slate-900 dark:to-purple-950/20 space-y-2 border border-purple-100 dark:border-purple-900/40">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">Monthly SEO Service</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${retainer.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                }`}>
                                                {retainer.status}
                                            </span>
                                        </div>
                                        <div className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
                                            {formatCurrency(retainer.monthly_amount)} <span className="text-xs text-slate-400 font-normal">/ mo</span>
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium">
                                            Billing cycle day: {retainer.billing_cycle_day} of every month
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-slate-400 italic text-xs">
                                    No active SEO retainers on record.
                                </div>
                            )}
                        </div>

                        {/* Dedicated Support Card */}
                        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 text-white space-y-4 shadow-xl border border-indigo-900/40 relative overflow-hidden">
                            <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 size-32 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-blue-600/30 border border-blue-400/30 text-blue-300">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm text-white">Dedicated Support</h3>
                                    <p className="text-xs text-slate-300">Sapta Agency Success Team</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                                Need help or want to request custom website features or SEO upgrades? Contact your dedicated project team anytime.
                            </p>
                            <div className="pt-2 flex items-center gap-2">
                                <a
                                    href={`mailto:${client.email || 'support@sapta.com'}`}
                                    className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold text-center transition-all border border-white/15 backdrop-blur-md flex items-center justify-center gap-1.5"
                                >
                                    <Mail className="size-3.5 text-blue-300" />
                                    <span>Email Support</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ClientPortalLayout>
    );
}
