'use client';

import { useState, useEffect } from 'react';
import { User, CheckCircle2, XCircle, Clock, Loader2, MessageCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HibahRequest {
  id: number;
  message: string;
  status: string;
  createdAt: string;
  requesterId: number;
  requester: {
    profile: { name: string; avatar: string | null } | null;
    email: string;
  };
}

interface Props {
  productId: string | number;
  productTitle?: string;
  productType?: string;
}

export function HibahRequestList({ productId, productTitle = 'Barang', productType = 'hibah' }: Props) {
  const [requests, setRequests] = useState<HibahRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/hibah?productId=${productId}`)
      .then(r => r.json())
      .then(data => setRequests(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [productId]);

  const handleDecision = async (requestId: number, status: 'approved' | 'rejected') => {
    setProcessing(requestId);
    try {
      const res = await fetch(`/api/hibah/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setRequests(prev =>
          prev.map(r => r.id === requestId
            ? { ...r, status }
            : status === 'approved' ? { ...r, status: 'rejected' } : r
          )
        );
      }
    } finally {
      setProcessing(null);
      setConfirmingId(null);
    }
  };

  const handleChat = async (requesterId: number, requesterName: string) => {
    try {
      const res = await fetch(`/api/chat/rooms?productId=${productId}&sellerId=${requesterId}`);
      const data = await res.json();
      if (data.room?.id) {
        router.push(`/chat?roomId=${data.room.id}&productId=${productId}&productTitle=${encodeURIComponent(productTitle)}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (requests.length === 0) return (
    <div className="text-center py-8 text-muted-foreground">
      <p className="text-4xl mb-2"></p>
      <p className="text-sm font-medium">Belum ada yang mengajukan hibah</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {requests.map(req => (
        <div key={req.id} className={`p-4 rounded-2xl border-2 transition-colors ${req.status === 'approved' ? 'border-green-200 bg-green-50' :
          req.status === 'rejected' ? 'border-border bg-muted opacity-60' :
            'border-border bg-card'
          }`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
              {req.requester.profile?.avatar
                ? <img src={req.requester.profile.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                : <User className="w-5 h-5 text-primary" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-sm text-foreground truncate">
                  {req.requester.profile?.name || req.requester.email}
                </p>
                <div className="flex items-center gap-2">
                  <StatusBadge status={req.status} />
                  <button
                    onClick={() => handleChat(req.requesterId, req.requester.profile?.name || req.requester.email)}
                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
                    title="Chat Pengaju"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{req.message}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(req.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {req.status === 'pending' && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setConfirmingId(req.id)}
                disabled={processing === req.id || confirmingId !== null}
                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1"
              >
                {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Pilih Penerima
              </button>
              <button
                onClick={() => handleDecision(req.id, 'rejected')}
                disabled={processing === req.id || confirmingId !== null}
                className="flex-1 py-2 bg-muted hover:bg-gray-200 text-foreground font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1"
              >
                <XCircle className="w-3 h-3" /> Tolak
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Confirmation Modal */}
      {confirmingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-xl border border-border">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-center mb-2">Konfirmasi Hibah</h3>
            <div className="bg-muted p-4 rounded-2xl mb-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Anda akan menghibahkan:</p>
              <p className="font-black text-lg text-foreground">{productTitle}</p>
              <p className="text-xs text-muted-foreground uppercase mt-1">Jenis: {productType}</p>
            </div>
            <p className="text-center text-sm font-medium mb-6">Yakin ingin menghibahkan barang ini? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmingId(null)}
                className="flex-1 py-3 bg-muted hover:bg-gray-200 text-foreground font-bold rounded-xl transition-colors"
                disabled={processing !== null}
              >
                Batal
              </button>
              <button
                onClick={() => handleDecision(confirmingId, 'approved')}
                className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors flex justify-center items-center"
                disabled={processing !== null}
              >
                {processing === confirmingId ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ya, Hibahkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return (
    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
      <CheckCircle2 className="w-3 h-3" /> Dipilih
    </span>
  );
  if (status === 'rejected') return (
    <span className="text-xs font-bold bg-gray-200 text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
      <XCircle className="w-3 h-3" /> Ditolak
    </span>
  );
  return (
    <span className="text-xs font-bold bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
      <Clock className="w-3 h-3" /> Menunggu
    </span>
  );
}

