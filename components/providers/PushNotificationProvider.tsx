'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  useEffect(() => {
    // Meminta izin notifikasi jika pengguna sudah login dan browser mendukung
    if (status === 'authenticated' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [status]);

  return <>{children}</>;
}

// Utilitas untuk memicu Notifikasi HP (Web Push Local)
export const sendLocalPushNotification = (title: string, options?: NotificationOptions) => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, options);
  }
};
