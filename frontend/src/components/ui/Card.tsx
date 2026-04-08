import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', padding = 'md', children, ...props }, ref) => {

        const paddings = {
            none: "p-0",
            sm: "p-3",
            md: "p-5",
            lg: "p-8"
        };

        return (
            <div
                ref={ref}
                className={`bg-slate-900 border border-slate-800 rounded-[8px] shadow-sm overflow-hidden ${paddings[padding]} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);
Card.displayName = 'Card';

export const CardHeader = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`flex flex-col space-y-1.5 pb-4 mb-4 border-b border-slate-800 ${className}`} {...props}>
        {children}
    </div>
);

export const CardTitle = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={`text-[18px] font-semibold tracking-tight text-gray-50 ${className}`} {...props}>
        {children}
    </h3>
);

export const CardDescription = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={`text-[14px] text-gray-400 ${className}`} {...props}>
        {children}
    </p>
);
