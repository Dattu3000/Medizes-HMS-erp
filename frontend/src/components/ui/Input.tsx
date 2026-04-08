import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, ...props }, ref) => {
        return (
            <div className="w-full flex flex-col gap-1.5">
                {label && <label className="text-[12px] font-medium text-gray-400">{label}</label>}
                <input
                    ref={ref}
                    className={`w-full h-[44px] px-3 rounded-[8px] bg-slate-950 border border-slate-800 text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500 focus:ring-red-500' : ''
                        } ${className}`}
                    {...props}
                />
                {error && <span className="text-[12px] text-red-500 mt-0.5">{error}</span>}
            </div>
        );
    }
);
Input.displayName = 'Input';
