import { router } from '@inertiajs/react';
import {
    AlertTriangle,
    Download,
    File,
    FileImage,
    FileSpreadsheet,
    FileText,
    LoaderCircle,
    Plus,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import React, { FormEvent, useState } from 'react';

export interface ClientDocumentItem {
    id: number;
    client_id: number;
    website_project_id?: number | null;
    client_service_id?: number | null;
    title: string;
    file_path: string;
    file_name: string;
    file_type: string;
    file_size: number;
    created_at?: string;
}

interface DocumentsTabProps {
    documents: ClientDocumentItem[];
    uploadUrl: string;
    deleteUrlPrefix: string;
    canUpload?: boolean;
    canDelete?: boolean;
}

export function formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileIcon(fileType: string) {
    const ext = (fileType || '').toLowerCase();
    if (ext === 'pdf') {
        return <FileText className="size-6 text-rose-500" />;
    }
    if (ext === 'doc' || ext === 'docx') {
        return <FileText className="size-6 text-blue-500" />;
    }
    if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') {
        return <FileSpreadsheet className="size-6 text-emerald-500" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
        return <FileImage className="size-6 text-purple-500" />;
    }
    return <File className="size-6 text-indigo-500" />;
}

export function getFileBadgeClass(fileType: string) {
    const ext = (fileType || '').toLowerCase();
    if (ext === 'pdf') {
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-800';
    }
    if (ext === 'doc' || ext === 'docx') {
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800';
    }
    if (ext === 'xls' || ext === 'xlsx' || ext === 'csv') {
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800';
    }
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/80 dark:border-purple-800';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
}

export default function DocumentsTab({
    documents = [],
    uploadUrl,
    deleteUrlPrefix,
    canUpload = true,
    canDelete = true,
}: DocumentsTabProps) {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [deletingDoc, setDeletingDoc] = useState<ClientDocumentItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleUploadSubmit = (e: FormEvent) => {
        e.preventDefault();
        setErrors({});
        setIsUploading(true);

        const formData = new FormData();
        formData.append('title', title);
        if (file) {
            formData.append('file', file);
        }

        router.post(uploadUrl, formData, {
            forceFormData: true,
            onSuccess: () => {
                setIsUploadModalOpen(false);
                setTitle('');
                setFile(null);
                setErrors({});
                setIsUploading(false);
            },
            onError: (errs) => {
                setIsUploading(false);
                setErrors(errs || {});
            },
            onFinish: () => setIsUploading(false),
        });
    };

    const handleDelete = () => {
        if (!deletingDoc) return;
        setIsDeleting(true);
        router.delete(`${deleteUrlPrefix}/${deletingDoc.id}`, {
            onSuccess: () => {
                setDeletingDoc(null);
                setIsDeleting(false);
            },
            onError: () => setIsDeleting(false),
            onFinish: () => setIsDeleting(false),
        });
    };

    return (
        <div className="space-y-6">
            {/* Header & Upload Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                        <FileText className="size-5 text-indigo-600 dark:text-indigo-400" />
                        <span>Attached Project & Service Documents</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Manage project contracts, proposals, specifications, reports, spreadsheets, and design specs.
                    </p>
                </div>

                {canUpload && (
                    <button
                        onClick={() => {
                            setErrors({});
                            setTitle('');
                            setFile(null);
                            setIsUploadModalOpen(true);
                        }}
                        className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-extrabold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                    >
                        <Plus className="size-4" />
                        <span>Upload Document</span>
                    </button>
                )}
            </div>

            {/* Documents Cards Grid */}
            {documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {documents.map((doc) => (
                        <div
                            key={doc.id}
                            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shrink-0">
                                            {getFileIcon(doc.file_type)}
                                        </div>
                                        <div className="space-y-1 min-w-0">
                                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate" title={doc.title}>
                                                {doc.title}
                                            </h4>
                                            <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-black uppercase tracking-wider border ${getFileBadgeClass(doc.file_type)}`}>
                                                .{doc.file_type}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1 text-xs">
                                    <p className="text-slate-600 dark:text-slate-400 font-medium truncate" title={doc.file_name}>
                                        <span className="text-slate-400">File:</span> {doc.file_name}
                                    </p>
                                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                                        <span>Size: {formatFileSize(doc.file_size)}</span>
                                        {doc.created_at && (
                                            <span>
                                                Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <a
                                    href={doc.file_path}
                                    download={doc.file_name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-8 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-gradient-to-r hover:from-[#003796] hover:via-[#0052D4] hover:to-[#1d4ed8] hover:text-white hover:shadow-md hover:shadow-blue-600/20 active:scale-[0.99] transition-all font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer border border-blue-200/60 dark:border-blue-900/40"
                                >
                                    <Download className="size-3.5" />
                                    <span>Download</span>
                                </a>

                                {canDelete && (
                                    <button
                                        type="button"
                                        onClick={() => setDeletingDoc(doc)}
                                        className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                                        title="Delete Document"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    <FileText className="size-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-200">No Documents Uploaded</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        No documents attached yet. Click "Upload Document" above to attach contracts, PDFs, Word docs, Excel sheets, or images.
                    </p>
                </div>
            )}

            {/* Upload Document Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] my-auto overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                                    <Upload className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Upload Document</h3>
                                    <p className="text-xs text-slate-400 font-medium">Attach files, contracts, or specifications</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsUploadModalOpen(false)}
                                className="size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} noValidate className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Document Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        if (errors.title) {
                                            setErrors((prev) => ({ ...prev, title: '' }));
                                        }
                                    }}
                                    placeholder="e.g. Project Scope Contract / Invoice Agreement / Wireframes"
                                    className={`w-full h-11 px-4 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                                        errors.title ? 'border-rose-500 text-rose-600 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                />
                                {errors.title && (
                                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{errors.title}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Select File <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp"
                                    onChange={(e) => {
                                        setFile(e.target.files ? e.target.files[0] : null);
                                        if (errors.file) {
                                            setErrors((prev) => ({ ...prev, file: '' }));
                                        }
                                    }}
                                    className={`w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border text-xs text-slate-700 dark:text-slate-300 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gradient-to-r file:from-[#003796] file:via-[#0052D4] file:to-[#1d4ed8] file:text-white hover:file:opacity-95 file:cursor-pointer file:shadow-xs cursor-pointer ${
                                        errors.file ? 'border-rose-500 text-rose-600 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                />
                                {errors.file && (
                                    <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 mt-1">{errors.file}</p>
                                )}
                                <p className="text-[11px] text-slate-400 font-medium mt-1">
                                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, CSV, PNG, JPG, JPEG, WEBP (Max 25MB)
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsUploadModalOpen(false)}
                                    disabled={isUploading}
                                    className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUploading}
                                    className="h-10 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading && <LoaderCircle className="size-4 animate-spin" />}
                                    <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingDoc && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] my-auto overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 relative text-center">
                        <button
                            type="button"
                            onClick={() => setDeletingDoc(null)}
                            className="absolute top-4 right-4 size-8 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="size-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
                            <AlertTriangle className="size-6" />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Document</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Are you sure you want to delete document <strong className="text-slate-900 dark:text-white">"{deletingDoc.title}"</strong>?
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setDeletingDoc(null)}
                                disabled={isDeleting}
                                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="h-10 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none transition-all cursor-pointer shadow-md shadow-rose-600/20"
                            >
                                {isDeleting ? (
                                    <>
                                        <LoaderCircle className="size-4 animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <span>Delete Document</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
