import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', children, ...props }) => {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold leading-none tracking-wide shrink-0',
          {
            'bg-muted text-foreground dark:bg-card dark:text-muted-foreground': variant === 'default',
            'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400': variant === 'success',
            'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400': variant === 'warning',
            'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400': variant === 'danger',
            'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400': variant === 'info',
            'bg-pink-50 text-primary dark:bg-pink-950/40 dark:text-primary': variant === 'primary',
          }
        ),
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
