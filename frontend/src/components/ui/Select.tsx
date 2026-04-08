import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'placeholder'> {
    label?: string;
    error?: string;
    placeholder?: string;
    options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', label, error, placeholder, options, ...props }, ref) => {
        return (
            <div className="w-full flex flex-col gap-1.5 relative">
                {label && <label className="text-[12px] font-medium text-gray-400">{label}</label>}
                <div className="relative">
                    <select
                        ref={ref}
                        {...(props.value !== undefined ? {} : { defaultValue: props.defaultValue || "" })}
                        className={`w-full h-[44px] px-3 pr-10 rounded-[8px] bg-slate-950 border border-slate-800 text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors disabled:opacity-50 appearance-none cursor-pointer hover:bg-slate-900 ${error ? 'border-red-500 focus:ring-red-500' : ''
                            } ${className}`}
                        {...props}
                    >
                        {placeholder && <option value="" disabled>{placeholder}</option>}
                        {options.map((opt, i) => (
                            <option key={i} value={opt.value} className="bg-slate-900 text-gray-50">
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {error && <span className="text-[12px] text-red-500 mt-0.5">{error}</span>}
            </div>
        );
    }
);
Select.displayName = 'Select';
