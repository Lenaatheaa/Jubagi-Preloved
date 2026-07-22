'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { toastStore, ToastMessage } from '@/hooks/useToast';

export const ToastProvider: React.FC = () => {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toastStore.subscribe((toasts) => {
      setMessages(toasts);
    });
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {messages.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-background text-foreground border border-border shadow-xl animate-slide-up"
        >
          {/* Icon */}
          <div className="shrink-0">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
          </div>
          
          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">
              {toast.message}
            </p>
          </div>
          
          {/* Close */}
          <button
            onClick={() => toastStore.remove(toast.id)}
            className="shrink-0 text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
