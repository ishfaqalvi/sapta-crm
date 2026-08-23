import Pagination, { type PaginatedData } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { hasPermission } from '@/utils/permissions';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Edit2,
    FolderKanban,
    Layers,
    LoaderCircle,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Website Projects', href: '/website-projects' },
    { title: 'Project Categories', href: '/project-categories' },
];

export interface ProjectCategoryItem {
    id: number;
    name: string;
    is_active: boolean;
    projects_count?: number;
    created_at?: string;
}

interface ProjectCategoriesIndexProps {
    categories: PaginatedData<ProjectCategoryItem>;
    stats: {
        total: number;
        active: number;
        inactive: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

interface CategoryForm {
    [key: string]: any;
    name: string;
    is_active: boolean;
}

export default function ProjectCategoriesIndex({ categories, stats, filters }: ProjectCategoriesIndexProps) {
    const { auth } = usePage().props as unknown as SharedData;
    const user = auth?.user;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || '');

    // Modal States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<ProjectCategoryItem | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<ProjectCategoryItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Forms
    const createForm = useForm<CategoryForm>({
        name: '',
        is_active: true,
    });

    const editForm = useForm<CategoryForm>({
        name: '',
        is_active: true,
    });

    // Debounced Search & Filter
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                '/project-categories',
                {
                    search: searchQuery || undefined,
                    status: statusFilter || undefined,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, statusFilter]);

    const handleCreateSubmit = (e: FormEvent) => {
        e.preventDefault();
        createForm.post('/project-categories', {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const handleEditOpen = (cat: ProjectCategoryItem) => {
        setEditingCategory(cat);
        editForm.setData({
            name: cat.name,
            is_active: Boolean(cat.is_active),
        });
    };

    const handleEditSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        editForm.put(`/project-categories/${editingCategory.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingCategory(null);
                editForm.reset();
            },
        });
    };

    const handleDeleteSubmit = () => {
        if (!deletingCategory) return;
        setIsDeleting(true);
        router.delete(`/project-categories/${deletingCategory.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeletingCategory(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Project Categories CRUD" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Project Categories Management
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            Define categories (Web App, Mobile App, etc.) to classify client website projects.
                        </p>
                    </div>

                    {hasPermission(user, 'create-project-categories') && (
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            className="h-10 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all inline-flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Add New Category</span>
                        </button>
                    )}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Categories</p>
                            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">{stats.total} Types</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            <Layers className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Categories</p>
                            <h3 className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.active}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-5" />
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Inactive</p>
                            <h3 className="text-lg font-extrabold text-slate-500 dark:text-slate-400 mt-0.5">{stats.inactive}</h3>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            <FolderKanban className="size-5" />
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <div className="relative flex-1 w-full md:max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search category name..."
                            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white px-3 focus:outline-none focus:border-blue-600 transition-all"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                    </div>
                </div>

                {/* Categories Table */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 uppercase tracking-wider text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-4">Category Name</th>
                                    <th className="px-6 py-4">Assigned Projects</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {categories.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No project categories found.
                                        </td>
                                    </tr>
                                ) : (
                                    categories.data.map((cat) => (
                                        <tr key={cat.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                    {cat.name}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                    {cat.projects_count || 0} Projects
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                {cat.is_active ? (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {hasPermission(user, 'edit-project-categories') && (
                                                        <button
                                                            onClick={() => handleEditOpen(cat)}
                                                            className="size-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                            title="Edit Category"
                                                        >
                                                            <Edit2 className="size-3.5" />
                                                        </button>
                                                    )}

                                                    {hasPermission(user, 'delete-project-categories') && (
                                                        <button
                                                            onClick={() => setDeletingCategory(cat)}
                                                            className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                                                            title="Delete Category"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination meta={categories} />
                </div>

                {/* CREATE CATEGORY MODAL */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                        <Layers className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Create Project Category
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Add new project classification type.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateOpen(false)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} noValidate className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="create_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Category Name *
                                    </Label>
                                    <Input
                                        id="create_name"
                                        value={createForm.data.name}
                                        onChange={(e) => createForm.setData('name', e.target.value)}
                                        placeholder="e.g. Mobile App or E-Commerce Store"
                                        required
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${
                                            createForm.errors.name
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {createForm.errors.name && (
                                        <p className="text-xs font-semibold text-rose-500">{createForm.errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="create_status" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Category Status
                                    </Label>
                                    <select
                                        id="create_status"
                                        value={createForm.data.is_active ? '1' : '0'}
                                        onChange={(e) => createForm.setData('is_active', e.target.value === '1')}
                                        className="h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    >
                                        <option value="1">Active</option>
                                        <option value="0">Inactive</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateOpen(false)}
                                        className="h-10 px-5 rounded-xl text-xs font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
                                    >
                                        {createForm.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>Save Category</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* EDIT CATEGORY MODAL */}
                {editingCategory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                        <Edit2 className="size-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                            Edit Category {editingCategory.name}
                                        </h3>
                                        <p className="text-xs text-slate-400">
                                            Update category name or status.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingCategory(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} noValidate className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Category Name *
                                    </Label>
                                    <Input
                                        id="edit_name"
                                        value={editForm.data.name}
                                        onChange={(e) => editForm.setData('name', e.target.value)}
                                        required
                                        className={`h-11 rounded-xl bg-slate-50 dark:bg-slate-950 text-sm font-semibold text-slate-900 dark:text-white transition-all ${
                                            editForm.errors.name
                                                ? 'border-rose-500 ring-2 ring-rose-500/20 focus:border-rose-500 focus:ring-rose-500/20'
                                                : 'border-slate-200 dark:border-slate-800 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
                                        }`}
                                    />
                                    {editForm.errors.name && (
                                        <p className="text-xs font-semibold text-rose-500">{editForm.errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="edit_status" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Category Status
                                    </Label>
                                    <select
                                        id="edit_status"
                                        value={editForm.data.is_active ? '1' : '0'}
                                        onChange={(e) => editForm.setData('is_active', e.target.value === '1')}
                                        className="h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 text-xs font-bold text-slate-900 dark:text-white focus:bg-white focus:border-blue-600 transition-all"
                                    >
                                        <option value="1">Active</option>
                                        <option value="0">Inactive</option>
                                    </select>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingCategory(null)}
                                        className="h-10 px-5 rounded-xl text-xs font-bold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={editForm.processing}
                                        className="h-10 px-5 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:from-[#002a75] hover:to-[#0040b8] text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center gap-2"
                                    >
                                        {editForm.processing ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Updating...</span>
                                            </>
                                        ) : (
                                            <span>Update Category</span>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE CONFIRMATION MODAL */}
                {deletingCategory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                        <div className="w-full max-w-md max-h-[90vh] my-auto overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
                            <button
                                type="button"
                                onClick={() => setDeletingCategory(null)}
                                className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                                <AlertTriangle className="size-6" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Project Category?</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Are you sure you want to delete category <strong className="text-slate-900 dark:text-white">"{deletingCategory.name}"</strong>? This action cannot be undone.
                                </p>
                            </div>

                            {deletingCategory.projects_count && deletingCategory.projects_count > 0 ? (
                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-800 dark:text-amber-300 text-left">
                                    <strong>Cannot Delete:</strong> This category is assigned to {deletingCategory.projects_count} project(s). Reassign or delete those projects first.
                                </div>
                            ) : null}

                            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setDeletingCategory(null)}
                                    disabled={isDeleting}
                                    className="h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                {!(deletingCategory.projects_count && deletingCategory.projects_count > 0) && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteSubmit}
                                        disabled={isDeleting}
                                        className="h-10 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-rose-600/20 active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>Deleting...</span>
                                            </>
                                        ) : (
                                            <span>Delete Category</span>
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
