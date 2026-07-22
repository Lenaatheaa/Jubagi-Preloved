import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(
            'inline-flex items-center justify-center font-bold rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
            {
              // Variants
              'bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/10': variant === 'primary',
              'bg-muted hover:bg-gray-200 text-foreground dark:bg-card dark:hover:bg-gray-700 dark:text-foreground': variant === 'secondary',
              'bg-transparent border-2 border-border hover:border-gray-300 dark:border-border dark:hover:border-gray-700 text-foreground dark:text-muted-foreground': variant === 'outline',
              'bg-transparent hover:bg-muted dark:hover:bg-card/50 text-foreground dark:text-muted-foreground': variant === 'ghost',
              'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/10': variant === 'danger',
              
              // Sizes
              'px-4 py-2 text-xs': size === 'sm',
              'px-6 py-3 text-sm': size === 'md',
              'px-8 py-4 text-base': size === 'lg',
            },
            className
          )
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
