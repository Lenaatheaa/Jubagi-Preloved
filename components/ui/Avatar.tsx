import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  showStatus = false,
  isOnline = false,
  className,
  ...props
}) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={twMerge(
        clsx(
          'relative rounded-full flex items-center justify-center font-bold text-white shrink-0 bg-gradient-to-br from-pink-200 to-primary',
          {
            'w-8 h-8 text-xs': size === 'sm',
            'w-12 h-12 text-sm': size === 'md',
            'w-16 h-16 text-lg': size === 'lg',
            'w-24 h-24 text-2xl': size === 'xl',
          }
        ),
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span>{initials || 'U'}</span>
      )}
      
      {showStatus && (
        <span
          className={twMerge(
            clsx(
              'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-950',
              {
                'w-2 h-2': size === 'sm',
                'w-3 h-3': size === 'md',
                'w-3.5 h-3.5': size === 'lg',
                'w-5 h-5': size === 'xl',
                'bg-green-400': isOnline,
                'bg-gray-400': !isOnline,
              }
            )
          )}
        />
      )}
    </div>
  );
};
