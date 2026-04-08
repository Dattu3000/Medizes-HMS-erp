import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'neutral';
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className = '', variant = 'default', children, ...props }, ref) => {
        const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-slate-900";

        const variants = {
            default: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
            success: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
            warning: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
            danger: "bg-red-500/10 text-red-500 border border-red-500/20",
            outline: "text-gray-50 border border-slate-700",
            neutral: "bg-slate-800 text-gray-300 border border-slate-700"
        };

        return (
            <div ref={ref} className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
                {children}
            </div>
        );
    }
);
Badge.displayName = 'Badge';
