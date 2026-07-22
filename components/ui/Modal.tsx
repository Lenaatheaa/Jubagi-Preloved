import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Card } from './Card';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // ESC key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <Card
        variant="default"
        className="relative w-full max-w-lg overflow-hidden shadow-2xl animate-slide-up z-10 bg-card dark:bg-gray-950 border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50 dark:border-gray-900">
          <h2 className="text-lg font-black text-foreground dark:text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="w-8 h-8 rounded-full bg-muted hover:bg-muted dark:bg-background dark:hover:bg-card text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-gray-300 flex items-center justify-center transition-colors focus-ring"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </Card>
    </div>
  );
};
