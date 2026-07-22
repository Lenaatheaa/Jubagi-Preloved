'use client';

import { useState, useEffect } from 'react';
import { Loader2, Gift, MessageSquare, Package } from 'lucide-react';

export default function AdminHibahPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'products' | 'requests'>('products');

  useEffect(() => {
    fetch('/api/admin/hibah')
      .then(async r => {
        const d = await r.json();
        if (r.ok) setData({
          hibahProducts: d.hibahProducts ?? [],
          hibahRequests: d.hibahRequests ?? [],
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const STATUS_BADGE: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Moderasi Hibah</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor dan kelola seluruh aktivitas hibah di JUBAGI</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        {[['products', ` Produk Hibah ${data ? `(${data.hibahProducts.length})` : ''}`], ['requests', ` Pengajuan ${data ? `(${data.hibahRequests.length})` : ''}`]].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val as any)}
            className={`px-5 py-3 text-sm font-bold transition-colors border-b-2 ${tab === val ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : tab === 'products' ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Produk</th>
                  <th className="px-6 py-4 text-left">Pemilik</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.hibahProducts.map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.image ? <img src={p.image} className="w-10 h-10 rounded-xl object-cover" alt="" /> : <div className="w-10 h-10 rounded-xl bg-gray-700 flex items-center justify-center"><Gift className="w-5 h-5 text-muted-foreground" /></div>}
                        <p className="font-semibold text-foreground truncate max-w-[200px]">{p.title || 'Tanpa Judul'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{p.sellerName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[p.status || 'pending'] || 'bg-muted0/20 text-muted-foreground'}`}>
                        {p.status || 'available'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(p.createdAt).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
                {data.hibahProducts.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">Tidak ada produk hibah</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">ID Request</th>
                  <th className="px-6 py-4 text-left">Produk ID</th>
                  <th className="px-6 py-4 text-left">Alasan</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.hibahRequests.map((r: any) => (
                  <tr key={r.id} className="hover:bg-muted transition-colors">
                    <td className="px-6 py-4 text-muted-foreground font-mono">#{r.id}</td>
                    <td className="px-6 py-4 text-muted-foreground">Produk #{r.productId}</td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-muted-foreground text-xs line-clamp-2">{r.message || <span className="text-muted-foreground italic">Tidak ada alasan</span>}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[r.status] || 'bg-amber-500/20 text-amber-400'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(r.createdAt).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
                {data.hibahRequests.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">Tidak ada pengajuan hibah</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
