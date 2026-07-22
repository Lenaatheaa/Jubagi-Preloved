'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface BoostRequest {
  id: number;
  productId: number;
  userId: number;
  durationDays: number;
  price: number;
  status: string;
  activeUntil: string | null;
  createdAt: string;
  product: {
    title: string;
    images: { imageUrl: string }[];
  };
  user: {
    email: string;
    profile: { name: string } | null;
  };
}

export default function AdminBoostsPage() {
  const [boosts, setBoosts] = useState<BoostRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/boosts')
      .then(res => res.json())
      .then(data => {
        setBoosts(data.boosts || []);
        setLoading(false);
      });
  }, []);

  const handleDecision = async (id: number, status: 'active' | 'rejected') => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/boosts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const data = await res.json();
        setBoosts(prev => prev.map(b => b.id === id ? { ...b, ...data.boost } : b));
      } else {
        alert('Gagal memproses pengajuan iklan.');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan.');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Manajemen Iklan (Boost)</h1>
            <p className="text-muted-foreground text-sm mt-1">Persetujuan untuk produk yang dipromosikan penjual.</p>
          </div>
        </div>

        {boosts.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border">
            <p className="text-lg font-bold text-muted-foreground">Belum ada pengajuan iklan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boosts.map(boost => (
              <div key={boost.id} className="bg-card p-5 rounded-3xl border border-border shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-border">
                    {boost.product.images?.[0] ? (
                      <img src={boost.product.images[0].imageUrl} alt="Produk" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Img</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{boost.product.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{boost.user.profile?.name || boost.user.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                       <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary">
                         {boost.durationDays} Hari
                       </span>
                       <span className="text-xs font-black text-foreground">Rp {boost.price.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-2xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-bold ${boost.status === 'active' ? 'text-green-600' : boost.status === 'rejected' ? 'text-red-500' : 'text-amber-600'}`}>
                      {boost.status === 'pending_approval' ? 'Menunggu Persetujuan' : boost.status.toUpperCase()}
                    </span>
                  </div>
                  {boost.activeUntil && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Aktif Sampai:</span>
                      <span className="font-bold">{new Date(boost.activeUntil).toLocaleDateString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diajukan Pada:</span>
                    <span className="font-medium">{new Date(boost.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                {boost.status === 'pending_approval' && (
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => handleDecision(boost.id, 'active')}
                      disabled={processing === boost.id}
                      className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      {processing === boost.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Setujui
                    </button>
                    <button
                      onClick={() => handleDecision(boost.id, 'rejected')}
                      disabled={processing === boost.id}
                      className="flex-1 py-2.5 bg-muted hover:bg-gray-200 text-foreground font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Tolak
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
