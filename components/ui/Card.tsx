import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'bordered';
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hoverEffect = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={twMerge(
          clsx(
            'rounded-3xl border transition-all duration-300',
            {
              // Variants
              'bg-background text-foreground border-border/80 shadow-sm': variant === 'default',
              'glass': variant === 'glass',
              'bg-background text-foreground border-transparent shadow-md hover:shadow-lg': variant === 'elevated',
              'bg-transparent border-border dark:border-border': variant === 'bordered',
              
              // Hover animations
              'hover:-translate-y-1 hover:shadow-md dark:hover:border-gray-700': hoverEffect,
            },
            className
          )
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
