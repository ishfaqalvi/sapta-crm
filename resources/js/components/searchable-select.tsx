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
    disabled?: boolean;
    required?: boolean;
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
    disabled = false,
    required = false,
    id,
    name,
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

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

    const handleSelect = (val: string | number) => {
        onChange(String(val));
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Hidden native input for form compatibility if needed */}
            {name && <input type="hidden" name={name} id={id} value={value ?? ''} required={required} />}

            {/* Select Trigger Button */}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between gap-2 px-3.5 h-10 text-xs sm:text-sm rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-left transition-all ${
                    isOpen
                        ? 'border-blue-500 ring-1 ring-blue-500 bg-white dark:bg-slate-900'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : 'cursor-pointer'}`}
            >
                <div className="truncate flex-1">
                    {selectedOption ? (
                        <div className="flex items-center gap-1.5 truncate">
                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                                {selectedOption.label}
                            </span>
                            {selectedOption.subLabel && (
                                <span className="text-slate-400 dark:text-slate-500 text-xs font-normal truncate">
                                    ({selectedOption.subLabel})
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-slate-400 dark:text-slate-500">{placeholder}</span>
                    )}
                </div>

                <ChevronDown
                    className={`size-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                />
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Input Box */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative flex items-center">
                            <Search className="absolute left-3 size-3.5 text-slate-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-8 pr-7 h-8 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                                        onClick={() => handleSelect(option.value)}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl text-left transition-all ${
                                            isSelected
                                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-medium'
                                        }`}
                                    >
                                        <div className="truncate flex-1 pr-2">
                                            <div className="truncate font-medium">{option.label}</div>
                                            {option.subLabel && (
                                                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-normal">
                                                    {option.subLabel}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && <Check className="size-4 text-blue-600 dark:text-blue-400 shrink-0" />}
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
