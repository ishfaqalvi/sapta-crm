import Pagination, { type PaginatedData } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    Check,
    ChevronDown,
    ChevronRight,
    Edit2,
    FolderPlus,
    GitBranch,
    LoaderCircle,
    Plus,
    Search,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { FormEventHandler, Fragment, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Company Setup',
        href: '/departments',
    },
    {
        title: 'Departments & Sub-Departments',
        href: '/departments',
    },
];

interface SubDepartmentItem {
    id: number;
    department_id: number;
    name: string;
    code: string | null;
    description: string | null;
    is_active: boolean;
    employees_count?: number;
}

interface DepartmentItem {
    id: number;
    name: string;
    code: string;
    description: string | null;
    is_active: boolean;
    employees_count: number;
    sub_departments_count: number;
    designations_count?: number;
    sub_departments: SubDepartmentItem[];
}

interface DepartmentsIndexProps {
    departments: PaginatedData<DepartmentItem>;
    filters?: {
        search?: string;
    };
}

export default function DepartmentsIndex({ departments, filters }: DepartmentsIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [expandedDeptIds, setExpandedDeptIds] = useState<number[]>([]);

    // Department Modal state
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);

    // Sub-Department Modal state
    const [isSubDeptModalOpen, setIsSubDeptModalOpen] = useState(false);
    const [targetDeptId, setTargetDeptId] = useState<number | null>(null);
    const [editingSubDept, setEditingSubDept] = useState<SubDepartmentItem | null>(null);

    // Delete Modal state
    const [deletingTarget, setDeletingTarget] = useState<{
        type: 'dept' | 'sub_dept';
        id: number;
        name: string;
        employees_count?: number;
        sub_departments_count?: number;
        designations_count?: number;
    } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Department Form
    const deptForm = useForm({
        name: '',
        code: '',
        description: '',
        is_active: true as boolean,
    });

    // Sub-Department Form
    const subDeptForm = useForm({
        department_id: 0,
        name: '',
        code: '',
        description: '',
        is_active: true as boolean,
    });

    // Search debounce
    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                route('departments.index'),
                { search: searchQuery },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const toggleExpand = (deptId: number) => {
        setExpandedDeptIds((prev) =>
            prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
        );
    };

    // Open Dept Modal
    const handleOpenDeptModal = (dept?: DepartmentItem) => {
        if (dept) {
            setEditingDept(dept);
            deptForm.setData({
                name: dept.name,
                code: dept.code,
                description: dept.description || '',
                is_active: dept.is_active,
            });
        } else {
            setEditingDept(null);
            deptForm.setData({
                name: '',
                code: '',
                description: '',
                is_active: true,
            });
        }
        deptForm.clearErrors();
        setIsDeptModalOpen(true);
    };

    // Open SubDept Modal
    const handleOpenSubDeptModal = (deptId: number, subDept?: SubDepartmentItem) => {
        setTargetDeptId(deptId);
        if (subDept) {
            setEditingSubDept(subDept);
            subDeptForm.setData({
                department_id: deptId,
                name: subDept.name,
                code: subDept.code || '',
                description: subDept.description || '',
                is_active: subDept.is_active,
            });
        } else {
            setEditingSubDept(null);
            subDeptForm.setData({
                department_id: deptId,
                name: '',
                code: '',
                description: '',
                is_active: true,
            });
        }
        subDeptForm.clearErrors();
        setIsSubDeptModalOpen(true);
    };

    // Submit Dept
    const handleDeptSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingDept) {
            deptForm.put(route('departments.update', editingDept.id), {
                preserveScroll: true,
                onSuccess: () => setIsDeptModalOpen(false),
            });
        } else {
            deptForm.post(route('departments.store'), {
                preserveScroll: true,
                onSuccess: () => setIsDeptModalOpen(false),
            });
        }
    };

    // Submit SubDept
    const handleSubDeptSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingSubDept) {
            subDeptForm.put(route('sub-departments.update', editingSubDept.id), {
                preserveScroll: true,
                onSuccess: () => setIsSubDeptModalOpen(false),
            });
        } else {
            subDeptForm.post(route('sub-departments.store'), {
                preserveScroll: true,
                onSuccess: () => setIsSubDeptModalOpen(false),
            });
        }
    };

    // Confirm Delete
    const handleConfirmDelete = () => {
        if (!deletingTarget || isDeleting) return;
        setIsDeleting(true);

        if (deletingTarget.type === 'dept') {
            router.delete(route('departments.destroy', deletingTarget.id), {
                preserveScroll: true,
                onSuccess: () => setDeletingTarget(null),
                onFinish: () => setIsDeleting(false),
            });
        } else {
            router.delete(route('sub-departments.destroy', deletingTarget.id), {
                preserveScroll: true,
                onSuccess: () => setDeletingTarget(null),
                onFinish: () => setIsDeleting(false),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Departments & Sub-Departments" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Departments & Sub-Departments
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Configure company organizational structure and sub-units.
                        </p>
                    </div>

                    <Button
                        onClick={() => handleOpenDeptModal()}
                        className="h-10 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                        <Plus className="size-4" />
                        <span>Add New Department</span>
                    </Button>
                </div>

                {/* Filter / Search Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search department or sub-department name/code..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <Building2 className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Total Departments: <strong className="text-slate-900 dark:text-white">{departments.total}</strong></span>
                    </div>
                </div>

                {/* Departments List / Tree Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Department / Sub-Units</th>
                                    <th className="px-6 py-4">Code</th>
                                    <th className="px-6 py-4">Sub-Departments</th>
                                    <th className="px-6 py-4">Employees</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {departments.data.length > 0 ? (
                                    departments.data.map((dept) => {
                                        const isExpanded = expandedDeptIds.includes(dept.id);
                                        const hasSubDepts = dept.sub_departments && dept.sub_departments.length > 0;

                                        return (
                                            <Fragment key={`dept-group-${dept.id}`}>
                                                <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors font-medium">
                                                    {/* Dept Name */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {hasSubDepts ? (
                                                                <button
                                                                    onClick={() => toggleExpand(dept.id)}
                                                                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
                                                                >
                                                                    {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                                                                </button>
                                                            ) : (
                                                                <div className="size-6" />
                                                            )}

                                                            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                                                                <Building2 className="size-4" />
                                                            </div>

                                                            <div>
                                                                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                                                    {dept.name}
                                                                </span>
                                                                {dept.description && (
                                                                    <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                                                                        {dept.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Code */}
                                                    <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                                                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs tracking-wider border border-slate-200/60 dark:border-slate-800">
                                                            {dept.code}
                                                        </span>
                                                    </td>

                                                    {/* Sub-Depts Count */}
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-xs">
                                                            <GitBranch className="size-3" />
                                                            <span>{dept.sub_departments_count} Sub-Units</span>
                                                        </span>
                                                    </td>

                                                    {/* Employees Count */}
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs">
                                                            <Users className="size-3" />
                                                            <span>{dept.employees_count} Employees</span>
                                                        </span>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${dept.is_active
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-800'
                                                            }`}>
                                                            {dept.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>

                                                    {/* Actions (Icon-Only Buttons) */}
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button
                                                                onClick={() => handleOpenSubDeptModal(dept.id)}
                                                                className="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                                title="Add Sub-Department"
                                                            >
                                                                <FolderPlus className="size-3.5" />
                                                            </button>

                                                            <button
                                                                onClick={() => handleOpenDeptModal(dept)}
                                                                className="size-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                                title="Edit Department"
                                                            >
                                                                <Edit2 className="size-3.5" />
                                                            </button>

                                                            <button
                                                                onClick={() => setDeletingTarget({
                                                                    type: 'dept',
                                                                    id: dept.id,
                                                                    name: dept.name,
                                                                    employees_count: dept.employees_count,
                                                                    sub_departments_count: dept.sub_departments_count,
                                                                    designations_count: dept.designations_count,
                                                                })}
                                                                className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                                title="Delete Department"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Sub-Departments Nested Rows */}
                                                {isExpanded && hasSubDepts && (
                                                    dept.sub_departments.map((sub) => (
                                                        <tr key={`sub-${sub.id}`} className="bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100/60 transition-colors text-xs">
                                                            <td className="px-6 py-3 pl-14">
                                                                <div className="flex items-center gap-2">
                                                                    <GitBranch className="size-3.5 text-purple-500 shrink-0" />
                                                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                                                        {sub.name}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-slate-500 font-semibold">
                                                                {sub.code || '—'}
                                                            </td>
                                                            <td className="px-6 py-3 text-slate-400 italic">
                                                                Sub-Unit
                                                            </td>
                                                            <td className="px-6 py-3 text-slate-500 font-semibold">
                                                                {sub.employees_count !== undefined ? `${sub.employees_count} Employees` : '—'}
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sub.is_active ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>
                                                                    {sub.is_active ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-3 text-right">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <button
                                                                        onClick={() => handleOpenSubDeptModal(dept.id, sub)}
                                                                        className="size-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                                                        title="Edit Sub-Department"
                                                                    >
                                                                        <Edit2 className="size-3" />
                                                                    </button>

                                                                    <button
                                                                        onClick={() => setDeletingTarget({
                                                                            type: 'sub_dept',
                                                                            id: sub.id,
                                                                            name: sub.name,
                                                                            employees_count: sub.employees_count,
                                                                        })}
                                                                        className="size-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                                                        title="Delete Sub-Department"
                                                                    >
                                                                        <Trash2 className="size-3" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                             </Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                            No departments found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={departments} />
                </div>

                {/* Department Create/Edit Modal (Upgraded UI Standard) */}
                {isDeptModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-2 animate-in fade-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <Building2 className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                                            {editingDept ? `Edit Department: ${editingDept.name}` : 'Create New Department'}
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Configure department code, name, and operational status.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsDeptModalOpen(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form noValidate onSubmit={handleDeptSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Department Name */}
                                    <div className="sm:col-span-2 space-y-1">
                                        <Label htmlFor="dept_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Department Name *
                                        </Label>
                                        <Input
                                            id="dept_name"
                                            value={deptForm.data.name}
                                            onChange={(e) => deptForm.setData('name', e.target.value)}
                                            placeholder="e.g. Software Engineering"
                                            className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${
                                                deptForm.errors.name
                                                    ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                        />
                                        {deptForm.errors.name && (
                                            <p className="text-xs font-semibold text-rose-500 mt-1">{deptForm.errors.name}</p>
                                        )}
                                    </div>

                                    {/* Department Code */}
                                    <div className="space-y-1">
                                        <Label htmlFor="dept_code" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Code *
                                        </Label>
                                        <Input
                                            id="dept_code"
                                            value={deptForm.data.code}
                                            onChange={(e) => deptForm.setData('code', e.target.value.toUpperCase())}
                                            placeholder="e.g. DEV"
                                            className={`h-11 rounded-xl uppercase font-extrabold bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white transition-all ${
                                                deptForm.errors.code
                                                    ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                            }`}
                                        />
                                        {deptForm.errors.code && (
                                            <p className="text-xs font-semibold text-rose-500 mt-1">{deptForm.errors.code}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <Label htmlFor="dept_description" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Department Description
                                    </Label>
                                    <Input
                                        id="dept_description"
                                        value={deptForm.data.description}
                                        onChange={(e) => deptForm.setData('description', e.target.value)}
                                        placeholder="Brief description of department scope and operations..."
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white transition-all ${
                                            deptForm.errors.description
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {deptForm.errors.description && (
                                        <p className="text-xs font-semibold text-rose-500 mt-1">{deptForm.errors.description}</p>
                                    )}
                                </div>

                                {/* Active Status Toggle Card */}
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="dept_active" className="text-xs font-extrabold text-slate-900 dark:text-white cursor-pointer block">
                                            Active Department Status
                                        </Label>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            Enable or disable this department across employee assignments.
                                        </p>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            id="dept_active"
                                            checked={deptForm.data.is_active}
                                            onChange={(e) => deptForm.setData('is_active', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {/* Modal Actions */}
                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsDeptModalOpen(false)}
                                        className="h-10 px-5 rounded-xl text-xs font-bold cursor-pointer"
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={deptForm.processing}
                                        className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
                                    >
                                        {deptForm.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving Department...</span>
                                            </>
                                        ) : (
                                            <span>{editingDept ? 'Update Department' : 'Save Department'}</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Sub-Department Create/Edit Modal (Upgraded UI Standard) */}
                {isSubDeptModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-2 animate-in fade-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                                        <GitBranch className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                                            {editingSubDept ? `Edit Sub-Unit: ${editingSubDept.name}` : 'Add Sub-Department Unit'}
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Configure sub-department branch under parent department.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsSubDeptModalOpen(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form noValidate onSubmit={handleSubDeptSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Sub-Unit Name */}
                                    <div className="sm:col-span-2 space-y-1">
                                        <Label htmlFor="sub_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Sub-Department Unit Name *
                                        </Label>
                                        <Input
                                            id="sub_name"
                                            value={subDeptForm.data.name}
                                            onChange={(e) => subDeptForm.setData('name', e.target.value)}
                                            placeholder="e.g. Frontend Engineering"
                                            className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${
                                                subDeptForm.errors.name
                                                    ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10'
                                            }`}
                                        />
                                        {subDeptForm.errors.name && (
                                            <p className="text-xs font-semibold text-rose-500 mt-1">{subDeptForm.errors.name}</p>
                                        )}
                                    </div>

                                    {/* Sub-Unit Code */}
                                    <div className="space-y-1">
                                        <Label htmlFor="sub_code" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Code
                                        </Label>
                                        <Input
                                            id="sub_code"
                                            value={subDeptForm.data.code}
                                            onChange={(e) => subDeptForm.setData('code', e.target.value.toUpperCase())}
                                            placeholder="e.g. FE"
                                            className={`h-11 rounded-xl uppercase font-extrabold bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white transition-all ${
                                                subDeptForm.errors.code
                                                    ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                    : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10'
                                            }`}
                                        />
                                        {subDeptForm.errors.code && (
                                            <p className="text-xs font-semibold text-rose-500 mt-1">{subDeptForm.errors.code}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <Label htmlFor="sub_description" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Description
                                    </Label>
                                    <Input
                                        id="sub_description"
                                        value={subDeptForm.data.description}
                                        onChange={(e) => subDeptForm.setData('description', e.target.value)}
                                        placeholder="Sub-unit responsibilities and scope..."
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white transition-all ${
                                            subDeptForm.errors.description
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10'
                                        }`}
                                    />
                                    {subDeptForm.errors.description && (
                                        <p className="text-xs font-semibold text-rose-500 mt-1">{subDeptForm.errors.description}</p>
                                    )}
                                </div>

                                {/* Active Status Toggle Card */}
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="sub_active" className="text-xs font-extrabold text-slate-900 dark:text-white cursor-pointer block">
                                            Active Sub-Unit Status
                                        </Label>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            Enable or disable this sub-unit.
                                        </p>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            id="sub_active"
                                            checked={subDeptForm.data.is_active}
                                            onChange={(e) => subDeptForm.setData('is_active', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>

                                {/* Modal Actions */}
                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsSubDeptModalOpen(false)}
                                        className="h-10 px-5 rounded-xl text-xs font-bold cursor-pointer"
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={subDeptForm.processing}
                                        className="h-10 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
                                    >
                                        {subDeptForm.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving Sub-Unit...</span>
                                            </>
                                        ) : (
                                            <span>{editingSubDept ? 'Update Sub-Unit' : 'Save Sub-Unit'}</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deletingTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setDeletingTarget(null)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                                    Delete {deletingTarget.type === 'dept' ? 'Department' : 'Sub-Department'}?
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{deletingTarget.name}"</strong>? This action cannot be undone.
                                </p>
                            </div>

                            {/* Child records checks */}
                            {deletingTarget.type === 'dept' && ((deletingTarget.employees_count || 0) > 0 || (deletingTarget.sub_departments_count || 0) > 0 || (deletingTarget.designations_count || 0) > 0) ? (
                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300 text-left">
                                    <strong>Cannot Delete:</strong> This department has {deletingTarget.employees_count || 0} assigned employee(s), {deletingTarget.sub_departments_count || 0} sub-department(s), and {deletingTarget.designations_count || 0} designation(s). Reassign or delete them first.
                                </div>
                            ) : deletingTarget.type === 'sub_dept' && (deletingTarget.employees_count || 0) > 0 ? (
                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300 text-left">
                                    <strong>Cannot Delete:</strong> This sub-department is assigned to {deletingTarget.employees_count} employee(s). Reassign or delete those employees first.
                                </div>
                            ) : null}

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingTarget(null)}
                                    disabled={isDeleting}
                                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>

                                {!(
                                    (deletingTarget.type === 'dept' && ((deletingTarget.employees_count || 0) > 0 || (deletingTarget.sub_departments_count || 0) > 0 || (deletingTarget.designations_count || 0) > 0)) ||
                                    (deletingTarget.type === 'sub_dept' && (deletingTarget.employees_count || 0) > 0)
                                ) && (
                                    <button
                                        type="button"
                                        onClick={handleConfirmDelete}
                                        disabled={isDeleting}
                                        className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-rose-600/20 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Deleting...</span>
                                            </>
                                        ) : (
                                            <span>Delete</span>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
