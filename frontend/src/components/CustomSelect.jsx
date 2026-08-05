import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ 
    value = '', 
    onChange, 
    options = [], 
    placeholder = 'Chọn...', 
    icon: Icon, 
    className = '',
    editable = false,
    onKeyDown
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const formattedOptions = options.map(opt => {
        if (typeof opt === 'object' && opt !== null) {
            return { value: String(opt.value), label: String(opt.label) };
        }
        return { value: String(opt), label: String(opt) };
    });

    const displayLabel = () => {
        const found = formattedOptions.find(opt => opt.value === String(value));
        if (found) return found.label;
        return value || '';
    };

    const [inputValue, setInputValue] = useState(displayLabel());

    useEffect(() => {
        setInputValue(displayLabel());
    }, [value, options]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = formattedOptions.filter(opt => {
        if (!editable || !inputValue) return true;
        const search = String(inputValue).toLowerCase();
        return opt.label.toLowerCase().includes(search) || opt.value.toLowerCase().includes(search);
    });

    const handleInputChange = (e) => {
        const newVal = e.target.value;
        setInputValue(newVal);
        onChange(newVal);
        if (!isOpen) setIsOpen(true);
    };

    const handleSelectOption = (opt) => {
        setInputValue(editable ? opt.value : opt.label);
        onChange(opt.value);
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} className={`relative inline-block text-left w-full ${className}`}>
            <div className="relative flex items-center">
                {Icon && (
                    <Icon size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-600 shrink-0 pointer-events-none z-10" />
                )}
                {editable ? (
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && onKeyDown) {
                                onKeyDown(e);
                            }
                        }}
                        placeholder={placeholder}
                        className={`w-full ${Icon ? 'pl-9' : 'pl-3.5'} pr-8 py-2.5 bg-white border border-slate-200/90 focus:border-indigo-400 rounded-2xl shadow-2xs font-semibold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200 placeholder-slate-400`}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className={`w-full ${Icon ? 'pl-9' : 'pl-3.5'} pr-8 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-indigo-300 rounded-2xl shadow-2xs font-semibold text-slate-700 text-xs flex items-center justify-between gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer text-left truncate`}
                    >
                        <span className="truncate">{displayLabel() || placeholder}</span>
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-1 cursor-pointer transition-colors"
                >
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                </button>
            </div>

            {isOpen && (
                <div className="absolute left-0 right-0 mt-1.5 z-50 bg-white/95 backdrop-blur-md border border-slate-150 rounded-2xl shadow-xl p-1.5 space-y-0.5 max-h-56 overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-150">
                    {filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-400 italic text-center">Không có lựa chọn khớp</div>
                    ) : (
                        filteredOptions.map((opt) => {
                            const isSelected = String(opt.value) === String(value);
                            return (
                                <button
                                    key={opt.value + opt.label}
                                    type="button"
                                    onClick={() => handleSelectOption(opt)}
                                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between gap-2 cursor-pointer ${
                                        isSelected
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'text-slate-700 hover:bg-indigo-50/80 hover:text-indigo-700'
                                    }`}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {isSelected && <Check size={14} className="shrink-0 text-white" />}
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
