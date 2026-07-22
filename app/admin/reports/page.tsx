'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Flag, Loader2, CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

export default function AdminReportsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && (session?.user as any)?.role !== 'admin')) {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchReports();
    }
  }, [status]);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: 'takedown' | 'reject') => {
    if (!confirm(`Yakin ingin melakukan aksi: ${action.toUpperCase()} pada laporan ini?`)) return;
    
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success(data.message);
      fetchReports();
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
        <ShieldAlert className="w-7 h-7 text-red-500" />
        <div>
          <h1 className="text-2xl font-black text-foreground">Moderasi Komunitas</h1>
          <p className="text-muted-foreground text-sm mt-1">Laporan dari pengguna terkait barang terlarang atau penipuan.</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Flag className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Tidak ada laporan masuk. Komunitas aman!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted text-muted-foreground text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Produk Dilaporkan</th>
                  <th className="px-6 py-4">Pelapor</th>
                  <th className="px-6 py-4">Alasan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/products/${r.productId}`} target="_blank" className="font-bold text-primary hover:underline">
                        {r.product?.title || 'Produk Dihapus'}
                      </Link>
                      <p className="text-xs text-muted-foreground uppercase mt-0.5">{r.product?.type === 'hibah' ? 'Hibah' : 'Jual'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{r.reporter?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{r.reporter?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-red-500">{r.reason}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </td>
                    <td className="px-6 py-4">
                      {r.status === 'pending' && <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md border border-yellow-200">Menunggu</span>}
                      {r.status === 'resolved' && <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-md border border-green-200">Di-takedown</span>}
                      {r.status === 'rejected' && <span className="text-xs font-bold bg-gray-100 text-gray-800 px-2 py-1 rounded-md border border-gray-200">Aman / Ditolak</span>}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {r.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAction(r.id, 'takedown')}
                            disabled={processingId === r.id}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
                          >
                            Takedown Produk
                          </button>
                          <button
                            onClick={() => handleAction(r.id, 'reject')}
                            disabled={processingId === r.id}
                            className="bg-white border border-border text-foreground hover:bg-muted font-bold px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
                          >
                            Tolak Laporan
                          </button>
                        </>
                      )}
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
