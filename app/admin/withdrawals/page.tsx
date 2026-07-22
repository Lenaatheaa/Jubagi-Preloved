'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Landmark, CheckCircle, XCircle, Clock, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface Withdrawal {
  id: number;
  userId: number;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  }
}

export default function AdminWithdrawalsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && (session?.user as any)?.role !== 'admin')) {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchWithdrawals();
    }
  }, [status]);

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/admin/withdrawals');
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: 'approved' | 'rejected') => {
    if (!confirm(`Apakah Anda yakin ingin menandai penarikan ini sebagai ${newStatus.toUpperCase()}?`)) return;
    
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message);
      
      toast.success(`Penarikan berhasil ditandai sebagai ${newStatus}`);
      fetchWithdrawals();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = withdrawals.filter(w => w.status === activeTab);

  if (loading) {
    return (
      <div className="flex justify-center pt-32 h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Landmark className="w-7 h-7 text-primary" /> Kelola Penarikan Dana
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Setujui dan transfer dana ke rekening penjual.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-px">
        {(['pending', 'approved', 'rejected'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-bold text-sm transition-colors border-b-2 ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {tab === 'pending' ? 'Menunggu Transfer' : tab === 'approved' ? 'Berhasil' : 'Ditolak'}
            <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
              {withdrawals.filter(w => w.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Landmark className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Tidak ada data penarikan untuk tab ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted text-muted-foreground text-xs uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Pengguna</th>
                  <th className="px-6 py-4">Info Rekening</th>
                  <th className="px-6 py-4">Jumlah</th>
                  <th className="px-6 py-4">Status</th>
                  {activeTab === 'pending' && <th className="px-6 py-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(w => (
                  <tr key={w.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      {new Date(w.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{w.user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{w.user?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="bg-muted p-2 rounded-lg inline-block border border-border">
                        <p className="font-bold text-primary">{w.bankName}</p>
                        <p className="text-foreground tracking-widest">{w.accountNumber}</p>
                        <p className="text-xs text-muted-foreground uppercase">{w.accountName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-lg">
                      Rp {w.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      {w.status === 'pending' && <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-md border border-yellow-200 flex w-fit items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>}
                      {w.status === 'approved' && <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-md border border-green-200 flex w-fit items-center gap-1"><CheckCircle className="w-3 h-3"/> Sukses</span>}
                      {w.status === 'rejected' && <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-md border border-red-200 flex w-fit items-center gap-1"><XCircle className="w-3 h-3"/> Ditolak</span>}
                    </td>
                    {activeTab === 'pending' && (
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleUpdateStatus(w.id, 'approved')}
                          disabled={processingId === w.id}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm disabled:opacity-50"
                        >
                          Tandai Sukses
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(w.id, 'rejected')}
                          disabled={processingId === w.id}
                          className="bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
                        >
                          Tolak (Refund)
                        </button>
                      </td>
                    )}
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
