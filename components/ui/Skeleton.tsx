import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circle' | 'card';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'default', ...props }) => {
  return (
    <div
      className={twMerge(
        clsx(
          'animate-pulse bg-gray-200/80 dark:bg-card',
          {
            'rounded-xl h-4 w-full': variant === 'default',
            'rounded-full': variant === 'circle',
            'rounded-3xl w-full aspect-[4/3]': variant === 'card',
          }
        ),
        className
      )}
      {...props}
    />
  );
};
