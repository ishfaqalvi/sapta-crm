import { Check, ChevronDown, Search, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

export interface SelectOption {
    value: string | number;
    label: string;
    subLabel?: string;
    disabled?: boolean;
}

interface SearchableSelectProps {
    options: SelectOption[];
    value: string | number | null | undefined;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    className?: string;
    triggerClassName?: string;
    disabled?: boolean;
    required?: boolean;
    hasError?: boolean;
    error?: string | boolean;
    id?: string;
    name?: string;
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select option...',
    searchPlaceholder = 'Search...',
    className = '',
    triggerClassName = '',
    disabled = false,
    required = false,
    hasError = false,
    error,
    id,
    name,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const isError = Boolean(hasError || error);
    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    const filteredOptions = options.filter((opt) => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;
        return (
            opt.label.toLowerCase().includes(term) ||
            (opt.subLabel && opt.subLabel.toLowerCase().includes(term))
        );
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const handleSelect = (val: string | number, isOptionDisabled?: boolean) => {
        if (isOptionDisabled) return;
        onChange(String(val));
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Hidden native input for form compatibility if needed */}
            {name && <input type="hidden" name={name} id={id} value={value ?? ''} required={required} />}

            {/* Select Trigger Button */}
            <button
                type="button"
                id={id}
                name={name}
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-3.5 h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 text-left font-semibold transition-all focus:outline-hidden ${
                    isError
                        ? 'border border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                        : 'border border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 hover:border-slate-300 dark:hover:border-slate-700'
                } ${
                    disabled ? 'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : 'cursor-pointer'
                } ${triggerClassName}`}
            >
                <div className="truncate pr-2">
                    {selectedOption ? (
                        <div className="flex flex-col">
                            <span className="text-slate-900 dark:text-white font-bold truncate">{selectedOption.label}</span>
                            {selectedOption.subLabel && (
                                <span className="text-[10px] text-slate-400 font-normal truncate">{selectedOption.subLabel}</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-slate-400 font-normal">{placeholder}</span>
                    )}
                </div>
                <ChevronDown className={`size-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Field */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative flex items-center">
                            <Search className="absolute left-3 size-3.5 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-8 pr-7 h-8 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-lg focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <X className="size-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 scrollbar-thin">
                        {filteredOptions.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400 italic">No matching options</div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = String(option.value) === String(value);
                                return (
                                    <button
                                        key={String(option.value)}
                                        type="button"
                                        disabled={option.disabled}
                                        onClick={() => handleSelect(option.value, option.disabled)}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-left transition-all ${
                                            option.disabled
                                                ? 'opacity-50 cursor-not-allowed text-slate-400 bg-slate-50/60 dark:bg-slate-900/40 select-none'
                                                : isSelected
                                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold cursor-pointer'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-medium cursor-pointer'
                                        }`}
                                    >
                                        <div className="truncate flex-1 pr-2">
                                            <div className="truncate font-semibold">{option.label}</div>
                                            {option.subLabel && (
                                                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-normal">{option.subLabel}</div>
                                            )}
                                        </div>
                                        {isSelected && <Check className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0 stroke-[3]" />}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
