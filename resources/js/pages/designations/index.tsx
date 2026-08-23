import Pagination, { type PaginatedData } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Briefcase,
    Building2,
    Edit2,
    LoaderCircle,
    Plus,
    Search,
    Trash2,
    Users,
    X,
} from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Company Setup',
        href: '/designations',
    },
    {
        title: 'Job Designations',
        href: '/designations',
    },
];

interface DepartmentSimple {
    id: number;
    name: string;
}

interface DesignationItem {
    id: number;
    name: string;
    department_id: number | null;
    department: DepartmentSimple | null;
    description: string | null;
    is_active: boolean;
    employees_count: number;
}

interface DesignationsIndexProps {
    designations: PaginatedData<DesignationItem>;
    departments: DepartmentSimple[];
    filters?: {
        search?: string;
    };
}

export default function DesignationsIndex({ designations, departments, filters }: DesignationsIndexProps) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDesignation, setEditingDesignation] = useState<DesignationItem | null>(null);

    const [deletingDesignation, setDeletingDesignation] = useState<DesignationItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm({
        name: '',
        department_id: '' as string | number,
        description: '',
        is_active: true as boolean,
    });

    const isInitialRender = useRef(true);
    useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                route('designations.index'),
                { search: searchQuery },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleOpenModal = (desig?: DesignationItem) => {
        if (desig) {
            setEditingDesignation(desig);
            form.setData({
                name: desig.name,
                department_id: desig.department_id || '',
                description: desig.description || '',
                is_active: desig.is_active,
            });
        } else {
            setEditingDesignation(null);
            form.setData({
                name: '',
                department_id: '',
                description: '',
                is_active: true,
            });
        }
        form.clearErrors();
        setIsModalOpen(true);
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (editingDesignation) {
            form.put(route('designations.update', editingDesignation.id), {
                preserveScroll: true,
                onSuccess: () => setIsModalOpen(false),
            });
        } else {
            form.post(route('designations.store'), {
                preserveScroll: true,
                onSuccess: () => setIsModalOpen(false),
            });
        }
    };

    const handleConfirmDelete = () => {
        if (!deletingDesignation || isDeleting) return;
        setIsDeleting(true);
        router.delete(route('designations.destroy', deletingDesignation.id), {
            preserveScroll: true,
            onSuccess: () => setDeletingDesignation(null),
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Job Designations" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Job Designations & Roles
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Manage job titles and position roles linked to departments.
                        </p>
                    </div>

                    <Button
                        onClick={() => handleOpenModal()}
                        className="h-10 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                        <Plus className="size-4" />
                        <span>Add New Designation</span>
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
                            placeholder="Search designation title or department..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <Briefcase className="size-4 text-blue-600 dark:text-blue-400" />
                        <span>Total Designations: <strong className="text-slate-900 dark:text-white">{designations.total}</strong></span>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Designation Title</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Employees Count</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {designations.data.length > 0 ? (
                                    designations.data.map((desig) => (
                                        <tr key={desig.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
                                                        <Briefcase className="size-4" />
                                                    </div>
                                                    <div>
                                                        <span className="font-extrabold text-slate-900 dark:text-white text-sm block">
                                                            {desig.name}
                                                        </span>
                                                        {desig.description && (
                                                            <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                                                                {desig.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {desig.department ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800">
                                                        <Building2 className="size-3 text-slate-500" />
                                                        <span>{desig.department.name}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">Global / General</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-xs">
                                                    <Users className="size-3" />
                                                    <span>{desig.employees_count} Employees</span>
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${desig.is_active
                                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-800'
                                                    }`}>
                                                    {desig.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleOpenModal(desig)}
                                                        className="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                        title="Edit Designation"
                                                    >
                                                        <Edit2 className="size-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeletingDesignation(desig)}
                                                        className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs"
                                                        title="Delete Designation"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                            No designations found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={designations} />
                </div>

                {/* Create / Edit Designation Modal (Upgraded UI Standard) */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 my-2 animate-in fade-in zoom-in-95 duration-200">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <Briefcase className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                                            {editingDesignation ? `Edit Designation: ${editingDesignation.name}` : 'Create New Designation'}
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Configure position title, parent department, and operational status.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form noValidate onSubmit={handleSubmit} className="space-y-4">
                                {/* Designation Title */}
                                <div className="space-y-1">
                                    <Label htmlFor="desig_title" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Designation Title *
                                    </Label>
                                    <Input
                                        id="desig_title"
                                        value={form.data.name}
                                        onChange={(e) => form.setData('name', e.target.value)}
                                        placeholder="e.g. Senior Full-Stack Engineer"
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${
                                            form.errors.name
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {form.errors.name && (
                                        <p className="text-xs font-semibold text-rose-500 mt-1">{form.errors.name}</p>
                                    )}
                                </div>

                                {/* Department Selector */}
                                <div className="space-y-1">
                                    <Label htmlFor="desig_dept" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Department Linkage (Optional)
                                    </Label>
                                    <select
                                        id="desig_dept"
                                        value={form.data.department_id}
                                        onChange={(e) => form.setData('department_id', e.target.value)}
                                        className={`w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white transition-all ${
                                            form.errors.department_id
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                    >
                                        <option value="">-- General / All Departments --</option>
                                        {departments.map((d) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                    {form.errors.department_id && (
                                        <p className="text-xs font-semibold text-rose-500 mt-1">{form.errors.department_id}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <Label htmlFor="desig_desc" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Description
                                    </Label>
                                    <Input
                                        id="desig_desc"
                                        value={form.data.description}
                                        onChange={(e) => form.setData('description', e.target.value)}
                                        placeholder="Position responsibilities and scope..."
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-900 dark:text-white transition-all ${
                                            form.errors.description
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {form.errors.description && (
                                        <p className="text-xs font-semibold text-rose-500 mt-1">{form.errors.description}</p>
                                    )}
                                </div>

                                {/* Active Status Toggle Card */}
                                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="desig_active" className="text-xs font-extrabold text-slate-900 dark:text-white cursor-pointer block">
                                            Active Designation Status
                                        </Label>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            Enable or disable this designation for staff assignment.
                                        </p>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            id="desig_active"
                                            checked={form.data.is_active}
                                            onChange={(e) => form.setData('is_active', e.target.checked)}
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
                                        onClick={() => setIsModalOpen(false)}
                                        className="h-10 px-5 rounded-xl text-xs font-bold cursor-pointer"
                                    >
                                        Cancel
                                    </Button>

                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                        className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
                                    >
                                        {form.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving Designation...</span>
                                            </>
                                        ) : (
                                            <span>{editingDesignation ? 'Update Designation' : 'Create Designation'}</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deletingDesignation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setDeletingDesignation(null)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">
                                    Delete Designation?
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{deletingDesignation.name}"</strong>? This action cannot be undone.
                                </p>
                            </div>

                            {/* Child employees check */}
                            {deletingDesignation.employees_count > 0 ? (
                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300 text-left">
                                    <strong>Cannot Delete:</strong> This designation is assigned to {deletingDesignation.employees_count} employee(s). Reassign or delete those employees first.
                                </div>
                            ) : null}

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingDesignation(null)}
                                    disabled={isDeleting}
                                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>

                                {!(deletingDesignation.employees_count > 0) && (
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
                                            <span>Delete Designation</span>
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
