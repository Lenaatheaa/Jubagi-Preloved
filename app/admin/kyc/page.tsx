'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Phone, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface VerifiedUser {
  id: number;
  email: string;
  profile: {
    name: string | null;
    phone: string | null;
    kycStatus: string;
  } | null;
}

export default function AdminKycPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [users, setUsers] = useState<VerifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && (session?.user as any)?.role !== 'admin')) {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchPending();
    }
  }, [status]);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/kyc');
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (userId: number, kycStatus: 'verified' | 'rejected') => {
    const label = kycStatus === 'verified' ? 'VERIFIKASI' : 'TOLAK';
    if (!confirm(`Yakin ingin ${label} nomor telepon pengguna ini?`)) return;

    setProcessingId(userId);
    try {
      const res = await fetch(`/api/admin/kyc/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kycStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(kycStatus === 'verified' ? 'Nomor telepon berhasil diverifikasi!' : 'Pengajuan berhasil ditolak.');
      fetchPending();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (s: string) => {
    if (s === 'verified') return <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">✓ Terverifikasi</span>;
    if (s === 'pending')  return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200">⏳ Menunggu</span>;
    if (s === 'rejected') return <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">✕ Ditolak</span>;
    return null;
  };

  if (loading) {
    return <div className="flex justify-center pt-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const pending  = users.filter(u => u.profile?.kycStatus === 'pending');
  const verified = users.filter(u => u.profile?.kycStatus === 'verified');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
          <Phone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Verifikasi Nomor Telepon</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Tinjau dan setujui pengajuan verifikasi nomor telepon pengguna.
          </p>
        </div>
        {pending.length > 0 && (
          <div className="ml-auto">
            <span className="flex items-center gap-1.5 bg-yellow-100 text-yellow-700 font-bold text-sm px-3 py-1.5 rounded-full border border-yellow-200">
              <AlertCircle className="w-4 h-4" /> {pending.length} Menunggu Review
            </span>
          </div>
        )}
      </div>

      {/* Pending */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-yellow-50/50">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" /> Menunggu Verifikasi
          </h2>
        </div>

        {pending.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Tidak ada pengajuan yang perlu ditinjau.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-3">Nama</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Nomor Telepon</th>
                  <th className="px-6 py-3 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pending.map(u => (
                  <tr key={u.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 font-bold text-foreground">{u.profile?.name || '-'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-foreground flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {u.profile?.phone || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleResolve(u.id, 'verified')}
                        disabled={processingId === u.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                      >
                        {processingId === u.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <CheckCircle className="w-3.5 h-3.5" />}
                        Verifikasi
                      </button>
                      <button
                        onClick={() => handleResolve(u.id, 'rejected')}
                        disabled={processingId === u.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Tolak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verified */}
      {verified.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Pengguna Terverifikasi ({verified.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-3">Nama</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Nomor Telepon</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {verified.map(u => (
                  <tr key={u.id} className="hover:bg-muted/50">
                    <td className="px-6 py-3 font-bold text-foreground">{u.profile?.name || '-'}</td>
                    <td className="px-6 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-6 py-3 font-mono font-bold text-foreground">{u.profile?.phone || '-'}</td>
                    <td className="px-6 py-3">{getStatusBadge(u.profile?.kycStatus || '')}</td>
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
