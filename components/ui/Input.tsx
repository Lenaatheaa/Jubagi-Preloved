import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, type = 'text', id, ...props }, ref) => {
    const inputId = id || React.useId();
    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={type}
            id={inputId}
            className={twMerge(
              clsx(
                'w-full py-3.5 pr-4 rounded-2xl border bg-background text-foreground text-sm text-foreground dark:text-foreground placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-primary transition-colors focus:ring-2 focus:ring-primary/10',
                {
                  'pl-11': icon,
                  'pl-4': !icon,
                  'border-border dark:border-border': !error,
                  'border-red-500 dark:border-red-600 focus:border-red-500 focus:ring-red-500/10': error,
                }
              ),
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-red-500 dark:text-red-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground dark:text-muted-foreground font-medium">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
