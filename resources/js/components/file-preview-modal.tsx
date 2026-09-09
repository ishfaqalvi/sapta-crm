import {
    Download,
    ExternalLink,
    Eye,
    File,
    FileCode,
    FileImage,
    FileSpreadsheet,
    FileText,
    Maximize2,
    Minimize2,
    Paperclip,
    RotateCw,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface FilePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileUrl: string | null;
    fileName?: string | null;
    fileType?: string | null;
    fileSize?: number | null;
}

export function formatBytes(bytes?: number | null): string {
    if (!bytes || bytes <= 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileExtension(filename?: string | null, type?: string | null): string {
    if (type && !type.includes('/')) return type.toLowerCase();
    if (!filename) return '';
    const parts = filename.split('?')[0].split('#')[0].split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export default function FilePreviewModal({
    isOpen,
    onClose,
    fileUrl,
    fileName,
    fileType,
    fileSize,
}: FilePreviewModalProps) {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [textContent, setTextContent] = useState<string | null>(null);
    const [isLoadingText, setIsLoadingText] = useState(false);

    const ext = getFileExtension(fileName || fileUrl, fileType);
    const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp', 'ico'].includes(ext);
    const isPdf = ext === 'pdf';
    const isText = ['txt', 'csv', 'json', 'log', 'md', 'sql', 'xml', 'js', 'ts', 'html'].includes(ext);
    const isWord = ['doc', 'docx'].includes(ext);
    const isExcel = ['xls', 'xlsx'].includes(ext);

    // Reset zoom and rotation whenever a new file is opened
    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setRotation(0);
            setIsFullscreen(false);
            setTextContent(null);

            if (isText && fileUrl) {
                setIsLoadingText(true);
                fetch(fileUrl)
                    .then((res) => (res.ok ? res.text() : Promise.reject('Failed to load text')))
                    .then((text) => {
                        setTextContent(text);
                        setIsLoadingText(false);
                    })
                    .catch(() => {
                        setTextContent(null);
                        setIsLoadingText(false);
                    });
            }
        }
    }, [isOpen, fileUrl, isText]);

    // Handle Escape Key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !fileUrl) return null;

    const displayName = fileName || fileUrl.split('/').pop() || 'Document Preview';

    const getIcon = () => {
        if (isImage) return <FileImage className="size-5 text-purple-500" />;
        if (isPdf) return <FileText className="size-5 text-rose-500" />;
        if (isExcel) return <FileSpreadsheet className="size-5 text-emerald-500" />;
        if (isWord) return <FileText className="size-5 text-blue-500" />;
        if (isText) return <FileCode className="size-5 text-amber-500" />;
        return <Paperclip className="size-5 text-indigo-500" />;
    };

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
    const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
    const handleReset = () => {
        setZoom(1);
        setRotation(0);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div
                className={`w-full ${
                    isFullscreen ? 'h-full max-w-full' : 'max-w-5xl h-[88vh]'
                } flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all duration-200`}
            >
                {/* Header Bar */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
                            {getIcon()}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                                    {displayName}
                                </h3>
                                {ext && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                        .{ext}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span>Preview Mode</span>
                                {fileSize ? <span>• {formatBytes(fileSize)}</span> : null}
                            </div>
                        </div>
                    </div>

                    {/* Header Controls */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {isImage && (
                            <div className="hidden sm:flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-xs">
                                <button
                                    type="button"
                                    onClick={handleZoomIn}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleZoomOut}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRotate}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                                    title="Rotate 90°"
                                >
                                    <RotateCw className="size-4" />
                                </button>
                                {(zoom !== 1 || rotation !== 0) && (
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="px-2 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="hidden md:flex p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
                            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        >
                            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                        </button>

                        <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
                            title="Open in New Tab"
                        >
                            <ExternalLink className="size-4" />
                        </a>

                        <a
                            href={fileUrl}
                            download={displayName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 px-3 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
                            title="Download File"
                        >
                            <Download className="size-3.5" />
                            <span className="hidden sm:inline">Download</span>
                        </a>

                        <button
                            type="button"
                            onClick={onClose}
                            className="size-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-center cursor-pointer ml-1"
                            title="Close Preview"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Preview Content Area */}
                <div className="flex-1 w-full bg-slate-100/70 dark:bg-slate-950/80 overflow-auto flex items-center justify-center relative p-2 sm:p-4">
                    {/* 1. IMAGE PREVIEW */}
                    {isImage && (
                        <div className="w-full h-full flex items-center justify-center overflow-auto">
                            <img
                                src={fileUrl}
                                alt={displayName}
                                style={{
                                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                                    transition: 'transform 0.2s ease-in-out',
                                }}
                                className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-800 select-none"
                            />
                        </div>
                    )}

                    {/* 2. PDF PREVIEW */}
                    {isPdf && (
                        <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col">
                            <iframe
                                src={`${fileUrl}#toolbar=1&navpanes=0`}
                                title={displayName}
                                className="w-full h-full border-0 flex-1"
                            />
                        </div>
                    )}

                    {/* 3. TEXT / CODE PREVIEW */}
                    {isText && (
                        <div className="w-full h-full rounded-2xl overflow-auto bg-slate-900 text-slate-100 p-4 sm:p-6 font-mono text-xs leading-relaxed border border-slate-800 shadow-inner">
                            {isLoadingText ? (
                                <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                                    <div className="size-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <span>Loading text contents...</span>
                                </div>
                            ) : textContent !== null ? (
                                <pre className="whitespace-pre-wrap break-words">{textContent}</pre>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                                    <FileCode className="size-10 text-slate-500" />
                                    <p className="text-sm font-bold text-slate-300">Unable to load direct text stream</p>
                                    <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                                    >
                                        Open Text File in Tab
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. OTHER DOCUMENT TYPES (Word, Excel, Zip, etc.) */}
                    {!isImage && !isPdf && !isText && (
                        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5 animate-in zoom-in-95 duration-200">
                            <div className="size-16 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200/70 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center shadow-xs">
                                {getIcon()}
                            </div>

                            <div className="space-y-1.5">
                                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white break-words">
                                    {displayName}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    This file type (<strong>.{ext.toUpperCase()}</strong>) cannot be rendered directly inside the browser canvas. You can open it in an external application or download it below.
                                </p>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 text-xs flex items-center justify-between text-slate-600 dark:text-slate-400">
                                <span className="font-semibold">Format / Size:</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                    .{ext.toUpperCase()} {fileSize ? `• ${formatBytes(fileSize)}` : ''}
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:flex-1 h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <ExternalLink className="size-3.5" />
                                    <span>Open in Browser</span>
                                </a>
                                <a
                                    href={fileUrl}
                                    download={displayName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:flex-1 h-10 px-4 rounded-xl bg-gradient-to-r from-[#003796] via-[#0052D4] to-[#1d4ed8] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Download className="size-3.5" />
                                    <span>Download File</span>
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
