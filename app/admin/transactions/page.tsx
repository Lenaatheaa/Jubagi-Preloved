'use client';

import { useState, useEffect } from 'react';
import { Loader2, ArrowLeftRight } from 'lucide-react';

export default function AdminTransactionsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/hibah')
      .then(async r => {
        const d = await r.json();
        if (r.ok) setData({ transactions: d.transactions ?? [] });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const STATUS_BADGE: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400',
    success: 'bg-green-500/20 text-green-400',
    failed: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-muted0/20 text-muted-foreground',
  };

  const exportToCSV = () => {
    if (!data?.transactions) return;
    const headers = ['ID', 'Produk ID', 'Pembeli ID', 'Penjual ID', 'Total', 'Status', 'Tanggal'];
    const rows = data.transactions.map((t: any) => [
      t.id, t.productId, t.buyerId, t.sellerId, t.totalPrice || 0, t.status, new Date(t.createdAt).toISOString()
    ]);
    const csvContent = [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `jubagi_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Monitoring Transaksi</h1>
          <p className="text-muted-foreground text-sm mt-1">Pantau seluruh aktivitas jual beli di platform</p>
        </div>
        <button onClick={exportToCSV} className="bg-primary hover:bg-primary/90 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm w-fit">
          Export ke CSV
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">ID</th>
                  <th className="px-6 py-4 text-left">Produk</th>
                  <th className="px-6 py-4 text-left">Pembeli</th>
                  <th className="px-6 py-4 text-left">Penjual</th>
                  <th className="px-6 py-4 text-left">Total</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(data?.transactions || []).map((t: any) => (
                  <tr key={t.id} className="hover:bg-muted transition-colors">
                    <td className="px-6 py-4 font-mono text-muted-foreground">#{t.id}</td>
                    <td className="px-6 py-4 text-muted-foreground">Produk #{t.productId}</td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">User #{t.buyerId}</td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">User #{t.sellerId}</td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {t.totalPrice ? `Rp ${t.totalPrice.toLocaleString('id-ID')}` : <span className="text-green-400">Hibah</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[t.status] || 'bg-amber-500/20 text-amber-400'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {(data?.transactions || []).length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">Belum ada transaksi</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
