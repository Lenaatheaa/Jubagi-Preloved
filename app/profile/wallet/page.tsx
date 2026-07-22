'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Wallet, Landmark, Clock, CheckCircle, XCircle, ChevronRight, Loader2, History } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const BANKS = [
  'BCA',
  'Mandiri',
  'BNI',
  'BRI',
  'BSI',
  'GoPay',
  'OVO',
  'Dana',
  'ShopeePay'
];

export default function WalletPage() {
  const { status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/');
    if (status === 'authenticated') fetchWallet();
  }, [status]);

  const fetchWallet = async () => {
    try {
      const res = await fetch('/api/wallet/withdraw');
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance || 0);
        setHistory(data.withdrawals || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount.replace(/\D/g, ''));
    
    if (amountNum > balance) {
      toast.error('Saldo tidak mencukupi!');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          bankName,
          accountNumber: accountNo,
          accountName
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menarik dana');
      }

      toast.success('Permintaan penarikan dana berhasil dibuat! Menunggu persetujuan Admin.');
      setShowModal(false);
      setWithdrawAmount('');
      setBankName('');
      setAccountNo('');
      setAccountName('');
      fetchWallet(); // refresh data
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') return <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-200"><CheckCircle className="w-3.5 h-3.5" /> Sukses</span>;
    if (status === 'rejected') return <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-200"><XCircle className="w-3.5 h-3.5" /> Ditolak</span>;
    return <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-200"><Clock className="w-3.5 h-3.5" /> Diproses</span>;
  };

  if (loading) return (
    <div className="min-h-screen bg-muted flex justify-center pt-32">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-muted pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        
        <h1 className="text-2xl font-black mb-6">Saldo & Pendapatan</h1>

        {/* BALANCE CARD */}
        <div className="bg-gradient-to-br from-primary to-[#e06699] rounded-3xl p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet className="w-32 h-32" />
          </div>
          
          <div className="relative z-10">
            <p className="text-white/80 font-bold mb-1">Total Saldo Tersedia</p>
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              Rp {balance.toLocaleString('id-ID')}
            </h2>
            
            <button 
              onClick={() => setShowModal(true)}
              disabled={balance < 10000}
              className="bg-white text-primary font-bold px-8 py-3 rounded-xl shadow-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tarik Dana
            </button>
            {balance < 10000 && (
              <p className="text-xs text-white/70 mt-2">*Minimal penarikan Rp 10.000</p>
            )}
          </div>
        </div>

        {/* HISTORY */}
        <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
          <div className="flex items-center gap-2 border-b border-border pb-4 mb-4">
            <History className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-bold">Riwayat Penarikan</h3>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Landmark className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Belum ada riwayat penarikan dana.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors border border-transparent hover:border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center">
                      <Landmark className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Tarik ke {item.bankName}</h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-foreground mb-1">- Rp {item.amount.toLocaleString('id-ID')}</p>
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* MODAL TARIK DANA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-border animate-in zoom-in-95 duration-200">
            <form onSubmit={handleWithdraw} className="p-6">
              <h3 className="text-xl font-black mb-4">Tarik Dana</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">Jumlah Penarikan</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">Rp</span>
                    <input 
                      type="text" 
                      required
                      placeholder="0"
                      value={withdrawAmount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (Number(val) > balance) return;
                        setWithdrawAmount(val ? Number(val).toLocaleString('id-ID') : '');
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-card transition-all font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">Bank / E-Wallet Tujuan</label>
                  <select 
                    required
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-card transition-all"
                  >
                    <option value="">-- Pilih Bank --</option>
                    {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">Nomor Rekening / No. HP</label>
                  <input 
                    type="text" 
                    required
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-card transition-all"
                    placeholder="Contoh: 1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">Nama Pemilik Rekening</label>
                  <input 
                    type="text" 
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-card transition-all"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-border font-bold text-sm text-foreground hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !withdrawAmount || !bankName || !accountNo || !accountName}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Permintaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
