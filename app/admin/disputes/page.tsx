'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Scale, Loader2, CheckCircle, XCircle, AlertCircle, MessageSquare, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

export default function AdminDisputesPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [noteFor, setNoteFor] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && (session?.user as any)?.role !== 'admin')) {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchDisputes();
    }
  }, [status]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/disputes');
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

  const handleResolve = async (disputeId: number, resolution: 'resolved_refund' | 'resolved_release') => {
    const actionText = resolution === 'resolved_refund' 
      ? 'KEMBALIKAN DANA KE PEMBELI (Refund)' 
      : 'TERUSKAN DANA KE PENJUAL';
    if (!confirm(`Yakin ingin melakukan resolusi: ${actionText}? Tindakan ini tidak dapat dibatalkan.`)) return;
    
    setProcessingId(disputeId);
    try {
      const res = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: resolution, adminNote: noteFor === disputeId ? adminNote : '' })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success('Resolusi komplain berhasil diproses!');
      setNoteFor(null);
      setAdminNote('');
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">Menunggu Tindakan</span>;
      case 'reviewing': return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200">Sedang Ditinjau</span>;
      case 'resolved_refund': return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full border border-blue-200">Diselesaikan - Refund</span>;
      case 'resolved_release': return <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">Diselesaikan - Dana ke Penjual</span>;
      default: return <span className="px-2.5 py-1 bg-muted text-muted-foreground text-xs font-bold rounded-full border border-border">{status}</span>;
    }
  };

  if (loading) {
    return <div className="flex justify-center pt-32 h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const openDisputes = disputes.filter(d => d.status === 'open' || d.status === 'reviewing');
  const resolvedDisputes = disputes.filter(d => d.status !== 'open' && d.status !== 'reviewing');

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
          <Scale className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Pusat Resolusi Komplain</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Arbitrase transaksi bermasalah antara pembeli dan penjual.</p>
        </div>
        <div className="ml-auto">
          {openDisputes.length > 0 && (
            <span className="flex items-center gap-1.5 bg-red-100 text-red-700 font-bold text-sm px-3 py-1.5 rounded-full border border-red-200">
              <AlertCircle className="w-4 h-4" /> {openDisputes.length} Perlu Tindakan
            </span>
          )}
        </div>
      </div>

      {/* Open Disputes */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-red-50/50">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" /> Komplain Menunggu Arbitrase
          </h2>
        </div>
        {openDisputes.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Tidak ada komplain yang perlu ditindaklanjuti.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {openDisputes.map(d => (
              <div key={d.id} className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-muted-foreground font-mono">DISPUTE-{d.id}</span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <p className="font-black text-foreground">{d.transaction?.product?.title || 'Produk Tidak Diketahui'}</p>
                      </div>
                      {getStatusBadge(d.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-0.5">Pengadu (Pembeli)</p>
                        <p className="font-bold text-sm">{d.complainant?.profile?.name || d.complainant?.email?.split('@')[0]}</p>
                        <p className="text-xs text-muted-foreground">{d.complainant?.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-0.5">Nilai Transaksi</p>
                        <p className="font-black text-primary">Rp {Number(d.transaction?.totalPrice || 0).toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold mb-0.5">TRX ID</p>
                        <Link href={`/transactions`} className="text-sm font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1">
                          TRX-{String(d.transactionId).padStart(6, '0')} <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
                      <p className="text-xs font-bold text-red-600 uppercase mb-1 flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />Alasan Komplain</p>
                      <p className="text-sm text-foreground">{d.reason}</p>
                      {d.evidenceUrl && (
                        <a href={d.evidenceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 text-xs text-indigo-600 hover:underline flex items-center gap-1 font-bold">
                          <ExternalLink className="w-3 h-3" /> Lihat Bukti Foto
                        </a>
                      )}
                    </div>

                    {noteFor === d.id && (
                      <div className="mb-4">
                        <textarea
                          placeholder="Catatan admin (opsional, akan dicatat di history transaksi)..."
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          rows={2}
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {noteFor !== d.id && (
                        <button
                          onClick={() => { setNoteFor(d.id); setAdminNote(''); }}
                          className="px-4 py-2 border border-border text-foreground text-sm font-bold rounded-xl hover:bg-muted transition-colors"
                        >
                          Tambah Catatan
                        </button>
                      )}
                      <button
                        onClick={() => handleResolve(d.id, 'resolved_refund')}
                        disabled={processingId === d.id}
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm shadow-amber-500/30 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {processingId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                        Refund ke Pembeli
                      </button>
                      <button
                        onClick={() => handleResolve(d.id, 'resolved_release')}
                        disabled={processingId === d.id}
                        className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {processingId === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Dana ke Penjual
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Disputes */}
      {resolvedDisputes.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" /> Riwayat Komplain Selesai ({resolvedDisputes.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Produk</th>
                  <th className="px-6 py-3">Nilai</th>
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {resolvedDisputes.map(d => (
                  <tr key={d.id} className="hover:bg-muted/50">
                    <td className="px-6 py-3 font-mono text-xs font-bold text-muted-foreground">DISPUTE-{d.id}</td>
                    <td className="px-6 py-3 font-medium text-foreground">{d.transaction?.product?.title || '-'}</td>
                    <td className="px-6 py-3 font-bold text-primary">Rp {Number(d.transaction?.totalPrice || 0).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">{new Date(d.createdAt).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-3">{getStatusBadge(d.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
