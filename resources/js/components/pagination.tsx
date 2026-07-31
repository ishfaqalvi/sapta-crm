import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links?: PaginationLink[];
}

interface CustomPaginationProps<T> {
    meta: PaginatedData<T>;
    onPageChange?: (page: number) => void;
}

export default function Pagination<T>({ meta, onPageChange }: CustomPaginationProps<T>) {
    if (!meta || meta.total <= meta.per_page) {
        return null;
    }

    const { current_page, last_page, from, to, total } = meta;

    const handleNavigate = (url: string | null, page: number) => {
        if (onPageChange) {
            onPageChange(page);
            return;
        }

        if (url) {
            router.get(url, {}, { preserveScroll: true, preserveState: true });
        }
    };

    // Calculate Page Number Links
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (last_page <= maxVisible) {
            for (let i = 1; i <= last_page; i++) pages.push(i);
        } else {
            if (current_page <= 3) {
                pages.push(1, 2, 3, 4, '...', last_page);
            } else if (current_page >= last_page - 2) {
                pages.push(1, '...', last_page - 3, last_page - 2, last_page - 1, last_page);
            } else {
                pages.push(1, '...', current_page - 1, current_page, current_page + 1, '...', last_page);
            }
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {/* Range Text */}
            <div>
                Showing <span className="font-extrabold text-slate-900 dark:text-white">{from ?? 0}</span> to{' '}
                <span className="font-extrabold text-slate-900 dark:text-white">{to ?? 0}</span> of{' '}
                <span className="font-extrabold text-slate-900 dark:text-white">{total}</span> entries
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5 select-none">
                {/* Previous Button */}
                <button
                    disabled={current_page === 1}
                    onClick={() => {
                        const prevLink = meta.links?.find((l) => l.label.includes('Previous'))?.url;
                        handleNavigate(prevLink || null, current_page - 1);
                    }}
                    className="size-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                    title="Previous Page"
                >
                    <ChevronLeft className="size-4" />
                </button>

                {/* Page Number Buttons */}
                {getPageNumbers().map((page, idx) => {
                    if (page === '...') {
                        return (
                            <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 select-none">
                                ...
                            </span>
                        );
                    }

                    const pageNum = Number(page);
                    const isCurrent = pageNum === current_page;
                    const linkUrl = meta.links?.find((l) => l.label === String(pageNum))?.url;

                    return (
                        <button
                            key={`page-${pageNum}`}
                            onClick={() => handleNavigate(linkUrl || null, pageNum)}
                            className={`size-8 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${
                                isCurrent
                                    ? 'bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] text-white shadow-md shadow-blue-600/20 scale-105'
                                    : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            {pageNum}
                        </button>
                    );
                })}

                {/* Next Button */}
                <button
                    disabled={current_page === last_page}
                    onClick={() => {
                        const nextLink = meta.links?.find((l) => l.label.includes('Next'))?.url;
                        handleNavigate(nextLink || null, current_page + 1);
                    }}
                    className="size-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                    title="Next Page"
                >
                    <ChevronRight className="size-4" />
                </button>
            </div>
        </div>
    );
}
