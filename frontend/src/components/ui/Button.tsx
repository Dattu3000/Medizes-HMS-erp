import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center font-medium rounded-[8px] transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

        const variants = {
            primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600",
            secondary: "bg-slate-800 text-gray-50 hover:bg-slate-700 focus:ring-slate-700 border border-slate-700",
            outline: "bg-transparent text-blue-500 border border-blue-600 hover:bg-blue-600/10 focus:ring-blue-600",
            danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
            ghost: "bg-transparent text-gray-300 hover:text-white hover:bg-slate-800 focus:ring-slate-700"
        };

        const sizes = {
            sm: "h-8 px-3 text-[12px]",
            md: "h-[44px] px-4 text-[14px]",
            lg: "h-12 px-6 text-[16px]"
        };

        const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

        return (
            <button ref={ref} className={classes} {...props}>
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';
