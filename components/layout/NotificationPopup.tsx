'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, MessageCircle, Gift, ArrowLeftRight, X, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface RealNotif {
  id: string;
  type: 'chat' | 'offer' | 'hibah' | 'transaction';
  title: string;
  body: string;
  time: string;
  read: boolean;
  link?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
}

const TYPE_ICON: Record<string, { icon: React.ReactNode; bg: string }> = {
  chat:        { icon: <MessageCircle className="w-4 h-4 text-blue-500" />,   bg: 'bg-blue-100' },
  offer:       { icon: <ArrowLeftRight className="w-4 h-4 text-primary" />, bg: 'bg-pink-100' },
  hibah:       { icon: <Gift className="w-4 h-4 text-green-500" />,            bg: 'bg-green-100' },
  transaction: { icon: <ArrowLeftRight className="w-4 h-4 text-purple-500" />, bg: 'bg-purple-100' },
};

export function NotificationPopup({ isOpen, onClose }: Props) {
  const [notifs, setNotifs] = useState<RealNotif[]>([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const popupRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const r = await fetch('/api/notifications');
      if (r.ok) {
        const d = await r.json();
        if (Array.isArray(d)) setNotifs(d);
      }
    } catch { /* silent */ }
  }, []);

  // Fetch saat dibuka
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchNotifs().finally(() => setLoading(false));

    // Poll setiap 30 detik saat popup terbuka
    intervalRef.current = setInterval(fetchNotifs, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOpen, fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  const markRead = (id: string) => setReadIds(prev => new Set([...prev, id]));
  const markAllRead = () => setReadIds(new Set(notifs.map(n => n.id)));

  const unreadCount = notifs.filter(n => !n.read && !readIds.has(n.id)).length;

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-full right-0 mt-2 w-80 bg-background rounded-2xl shadow-2xl border border-border z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-foreground" />
          <span className="font-black text-sm text-foreground">Notifikasi</span>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary font-bold hover:underline">
            Tandai semua dibaca
          </button>
        )}
      </div>

      {/* Notif list */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {loading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Belum ada notifikasi</p>
          </div>
        ) : (
          notifs.map(notif => {
            const clearedAtStr = typeof window !== 'undefined' ? localStorage.getItem('notifClearedAt') : null;
            const clearedAt = clearedAtStr ? parseInt(clearedAtStr) : 0;
            const isRead = notif.read || readIds.has(notif.id) || new Date(notif.time).getTime() <= clearedAt;
            const { icon, bg } = TYPE_ICON[notif.type] || TYPE_ICON.chat;
            const inner = (
              <button
                key={notif.id}
                onClick={() => markRead(notif.id)}
                className={`w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-muted transition-colors ${
                  !isRead ? 'bg-pink-50/50' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${bg}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!isRead ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(notif.time)}</p>
                </div>
                {!isRead && <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />}
              </button>
            );

            return notif.link ? (
              <Link key={notif.id} href={notif.link} onClick={() => { markRead(notif.id); onClose(); }}>
                {inner}
              </Link>
            ) : inner;
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border text-center">
        <button
          onClick={fetchNotifs}
          className="text-xs font-bold text-primary hover:underline"
        >
          Perbarui notifikasi
        </button>
      </div>
    </div>
  );
}
