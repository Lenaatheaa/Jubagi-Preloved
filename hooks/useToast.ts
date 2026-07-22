export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// Gunakan window-based simple store jika zustand belum terpasang, atau simple global state
// Karena zustand tidak terpasang di package.json, kita akan memakai custom global state manager sederhana
type Listener = (toasts: ToastMessage[]) => void;
let toasts: ToastMessage[] = [];
let listeners: Listener[] = [];

const notify = () => {
  listeners.forEach((listener) => listener([...toasts]));
};

export const toastStore = {
  add: (message: string, type: ToastType = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, message, type, duration };
    toasts.push(newToast);
    notify();

    setTimeout(() => {
      toastStore.remove(id);
    }, duration);
  },
  remove: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
  subscribe: (listener: Listener) => {
    listeners.push(listener);
    listener([...toasts]);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },
};

export const useToast = () => {
  return {
    success: (msg: string, duration?: number) => toastStore.add(msg, 'success', duration),
    error: (msg: string, duration?: number) => toastStore.add(msg, 'error', duration),
    info: (msg: string, duration?: number) => toastStore.add(msg, 'info', duration),
  };
};
