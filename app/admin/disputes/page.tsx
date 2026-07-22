'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Scale, Loader2, CheckCircle2, ShieldAlert, XCircle, ArrowLeftRight } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

export default function AdminDisputesPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && (session?.user as any)?.role !== 'admin')) {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchDisputes();
    }
  }, [status]);

  const fetchDisputes = async () => {
    try {
      const res = await fetch('/api/admin/disputes');
      if (res.ok) {
        const data = await res.json();
        setDisputes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: number, action: 'refund_buyer' | 'forward_seller') => {
    const actionText = action === 'refund_buyer' ? 'KEMBALIKAN DANA KE PEMBELI' : 'TERUSKAN DANA KE PENJUAL';
    if (!confirm(`Yakin ingin melakukan arbitrase: ${actionText}?`)) return;
    
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/disputes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success(data.message);
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center pt-32 h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Scale className="w-7 h-7 text-amber-500" />
        <div>
          <h1 className="text-2xl font-black text-foreground">Resolusi Komplain (Disputes)</h1>
          <p className="text-muted-foreground text-sm mt-1">Arbitrase transaksi bermasalah antara pembeli dan penjual.</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {disputes.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Scale className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Tidak ada transaksi yang berstatus komplain saat ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted text-muted-foreground text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">ID Transaksi</th>
                  <th className="px-6 py-4">Pembeli</th>
                  <th className="px-6 py-4">Penjual</th>
                  <th className="px-6 py-4">Nilai Transaksi</th>
                  <th className="px-6 py-4 text-right">Arbitrase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {disputes.map(d => (
                  <tr key={d.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-mono text-muted-foreground font-bold">TRX-00{d.id}</p>
                      <Link href={`/products/${d.productId}`} target="_blank" className="text-xs text-primary hover:underline mt-0.5 inline-block">
                        Lihat Produk
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{d.buyer?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{d.buyer?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{d.seller?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{d.seller?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-lg text-primary">Rp {d.totalPrice?.toLocaleString('id-ID') || 0}</p>
                      <p className="text-xs text-muted-foreground">{d.product?.type === 'hibah' ? 'Ongkir Saja' : 'Harga + Ongkir'}</p>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleResolve(d.id, 'refund_buyer')}
                        disabled={processingId === d.id}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
                      >
                        Refund Pembeli
                      </button>
                      <button
                        onClick={() => handleResolve(d.id, 'forward_seller')}
                        disabled={processingId === d.id}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
                      >
                        Teruskan ke Penjual
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
