import SearchableSelect from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckSquare,
    Clock,
    Download,
    FileText,
    LoaderCircle,
    Paperclip,
    Save,
    Tag,
    Trash2,
    UploadCloud,
    User,
    X,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface TaskCategorySimple {
    id: number;
    name: string;
}

interface EmployeeSimple {
    id: number;
    name: string;
    employee_code: string;
}

interface TaskItem {
    id: number;
    task_code: string;
    task_title: string;
    task_category_id: number | null;
    assigned_employee_id: number | null;
    created_by_user_id: number | null;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
    start_date: string | null;
    due_date: string | null;
    description: string | null;
    attachment: string | null;
    attachment_name: string | null;
    completed_at: string | null;
}

interface TasksEditProps {
    task: TaskItem;
    categories: TaskCategorySimple[];
    employees: EmployeeSimple[];
}

export default function TasksEdit({ task, categories = [], employees = [] }: TasksEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'General Tasks',
            href: '/tasks',
        },
        {
            title: `Edit Task - ${task.task_code}`,
            href: `/tasks/${task.id}/edit`,
        },
    ];

    const [newFile, setNewFile] = useState<File | null>(null);
    const [removeAttachment, setRemoveAttachment] = useState(false);

    const formatDateForInput = (dateStr: string | null | undefined): string => {
        if (!dateStr) return '';
        if (dateStr.includes('T')) {
            return dateStr.split('T')[0];
        }
        if (dateStr.includes(' ')) {
            return dateStr.split(' ')[0];
        }
        return dateStr;
    };

    const form = useForm<{
        _method: string;
        task_title: string;
        task_category_id: string | number;
        assigned_employee_id: string | number;
        priority: 'low' | 'medium' | 'high' | 'urgent';
        status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
        start_date: string;
        due_date: string;
        description: string;
        attachment: File | null;
        remove_attachment: boolean;
    }>({
        _method: 'PUT',
        task_title: task.task_title || '',
        task_category_id: task.task_category_id || '',
        assigned_employee_id: task.assigned_employee_id || '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
        start_date: formatDateForInput(task.start_date),
        due_date: formatDateForInput(task.due_date),
        description: task.description || '',
        attachment: null,
        remove_attachment: false,
    });

    const categoryOptions = categories.map((cat) => ({
        value: String(cat.id),
        label: cat.name,
    }));

    const employeeOptions = employees.map((emp) => ({
        value: String(emp.id),
        label: emp.name,
        subLabel: emp.employee_code,
    }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setNewFile(file);
            setRemoveAttachment(false);
            form.setData((prev) => ({
                ...prev,
                attachment: file,
                remove_attachment: false,
            }));
        }
    };

    const handleRemoveExistingAttachment = () => {
        setRemoveAttachment(true);
        setNewFile(null);
        form.setData((prev) => ({
            ...prev,
            attachment: null,
            remove_attachment: true,
        }));
    };

    const handleCancelRemove = () => {
        setRemoveAttachment(false);
        form.setData((prev) => ({
            ...prev,
            remove_attachment: false,
        }));
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('tasks.update', task.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Task ${task.task_code}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Page Header with Back Link on Right */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="h-7 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50 inline-flex items-center">
                                {task.task_code}
                            </span>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                Edit Task Details
                            </h1>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Modify task assignment, category, priority, status, schedule, attachment, and instructions.
                        </p>
                    </div>

                    <Link
                        href="/tasks"
                        className="h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all inline-flex items-center gap-2 shadow-2xs self-start sm:self-auto shrink-0"
                    >
                        <ArrowLeft className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Back to Directory</span>
                    </Link>
                </div>

                <form noValidate onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Task Identity & Classification */}
                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                <CheckSquare className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Task Overview & Assignment
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Task title, category classification, employee assignment, priority level, and current status.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Task Title */}
                            <div className="space-y-1.5">
                                <Label htmlFor="task_title" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Task Title *
                                </Label>
                                <Input
                                    id="task_title"
                                    value={form.data.task_title}
                                    onChange={(e) => form.setData('task_title', e.target.value)}
                                    placeholder="e.g. Design monthly promo banners or Update server SSL certificate"
                                    required
                                    className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 transition-all ${form.errors.task_title
                                        ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                        : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                />
                                {form.errors.task_title && (
                                    <p className="text-xs font-semibold text-rose-500">{form.errors.task_title}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Task Category *
                                    </Label>
                                    <SearchableSelect
                                        options={categoryOptions}
                                        value={String(form.data.task_category_id)}
                                        onChange={(val) => form.setData('task_category_id', val)}
                                        placeholder="Select Category *"
                                        searchPlaceholder="Type category name..."
                                        hasError={Boolean(form.errors.task_category_id)}
                                    />
                                    {form.errors.task_category_id && (
                                        <p className="text-xs font-semibold text-rose-500">{form.errors.task_category_id}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Assign Employee
                                    </Label>
                                    <SearchableSelect
                                        options={employeeOptions}
                                        value={String(form.data.assigned_employee_id)}
                                        onChange={(val) => form.setData('assigned_employee_id', val)}
                                        placeholder="Select Employee"
                                        searchPlaceholder="Type employee name..."
                                        hasError={Boolean(form.errors.assigned_employee_id)}
                                    />
                                    {form.errors.assigned_employee_id && (
                                        <p className="text-xs font-semibold text-rose-500">{form.errors.assigned_employee_id}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="priority" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Priority Level *
                                    </Label>
                                    <select
                                        id="priority"
                                        value={form.data.priority}
                                        onChange={(e: any) => form.setData('priority', e.target.value)}
                                        className={`w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white transition-all focus:outline-none ${form.errors.priority
                                            ? 'border border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                    >
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                        <option value="urgent">Urgent Priority</option>
                                    </select>
                                    {form.errors.priority && (
                                        <p className="text-xs font-semibold text-rose-500">{form.errors.priority}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="status" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Current Status *
                                    </Label>
                                    <select
                                        id="status"
                                        value={form.data.status}
                                        onChange={(e: any) => form.setData('status', e.target.value)}
                                        className={`w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white transition-all focus:outline-none ${form.errors.status
                                            ? 'border border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="in_review">In Review</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    {form.errors.status && (
                                        <p className="text-xs font-semibold text-rose-500">{form.errors.status}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                <Calendar className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Timeline Schedule & Document Attachment
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Start date, deadline due date, and reference document file attachments.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="start_date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Start Date (Optional)
                                    </Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={form.data.start_date}
                                        onChange={(e) => form.setData('start_date', e.target.value)}
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white transition-all ${form.errors.start_date
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {form.errors.start_date && (
                                        <p className="text-xs font-semibold text-rose-500">{form.errors.start_date}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="due_date" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Due Date / Deadline (Optional)
                                    </Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={form.data.due_date}
                                        onChange={(e) => form.setData('due_date', e.target.value)}
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white transition-all ${form.errors.due_date
                                            ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                            : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                    />
                                    {form.errors.due_date && (
                                        <p className="text-xs font-semibold text-rose-500">{form.errors.due_date}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                    <Paperclip className="size-3.5 text-blue-600" />
                                    <span>Task Attachment</span>
                                </Label>

                                {task.attachment && !removeAttachment && !newFile && (
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                                <FileText className="size-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                                                    {task.attachment_name || 'Task Attachment'}
                                                </p>
                                                <a
                                                    href={route('tasks.download-attachment', task.id)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                                                >
                                                    <Download className="size-3" />
                                                    <span>Download Current File</span>
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <label className="h-9 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer inline-flex items-center gap-1.5">
                                                <UploadCloud className="size-3.5" />
                                                <span>Replace</span>
                                                <input
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.txt"
                                                />
                                            </label>

                                            <button
                                                type="button"
                                                onClick={handleRemoveExistingAttachment}
                                                className="h-9 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all inline-flex items-center gap-1.5"
                                            >
                                                <Trash2 className="size-3.5" />
                                                <span>Remove</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {removeAttachment && !newFile && (
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800">
                                        <div className="text-xs font-bold text-rose-700 dark:text-rose-300">
                                            Attachment marked for removal. Click save to confirm.
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCancelRemove}
                                            className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:underline"
                                        >
                                            Undo
                                        </button>
                                    </div>
                                )}

                                {newFile && (
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-blue-600 text-white">
                                                <FileText className="size-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                                                    {newFile.name} (New File)
                                                </p>
                                                <p className="text-[10px] font-mono text-slate-500">
                                                    {(newFile.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewFile(null);
                                                form.setData('attachment', null);
                                            }}
                                            className="p-2 rounded-xl text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950 transition-all"
                                            title="Cancel New Upload"
                                        >
                                            <X className="size-5" />
                                        </button>
                                    </div>
                                )}

                                {(!task.attachment || removeAttachment) && !newFile && (
                                    <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${form.errors.attachment
                                        ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/50 dark:hover:bg-slate-900/50'
                                        }`}>
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <UploadCloud className="size-8 text-blue-600 dark:text-blue-400 mb-2" />
                                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                Click or drag file to attach
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                PDF, DOCX, XLS, PNG, JPG, ZIP (Max 10MB)
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.txt"
                                        />
                                    </label>
                                )}

                                {form.errors.attachment && (
                                    <p className="text-xs font-semibold text-rose-500">{form.errors.attachment}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                                <FileText className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                    Task Deliverables & Instructions
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Detailed guidelines, requirements, scope, or external reference links.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Detailed Instructions & Description (Optional)
                            </Label>
                            <textarea
                                id="description"
                                rows={4}
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                                placeholder="Enter specific instructions, reference links, or task deliverables..."
                                className={`w-full rounded-xl bg-slate-50 dark:bg-slate-950 p-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 transition-all focus:outline-none ${form.errors.description
                                    ? 'border border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                    : 'border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                    }`}
                            />
                            {form.errors.description && (
                                <p className="text-xs font-semibold text-rose-500">{form.errors.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-4 pb-12 border-t border-slate-200/80 dark:border-slate-800">
                        <Link
                            href="/tasks"
                            className="h-10 px-6 text-xs font-bold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center shadow-2xs"
                        >
                            Cancel
                        </Link>

                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="h-10 px-6 text-sm font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-lg shadow-blue-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {form.processing ? (
                                <div className="flex items-center gap-2">
                                    <LoaderCircle className="size-4 animate-spin" />
                                    <span>Updating Task...</span>
                                </div>
                            ) : (
                                <span>Update Task</span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
