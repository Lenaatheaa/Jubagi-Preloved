'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Clock, CheckCircle, XCircle, Search, CreditCard, Star, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';

interface Transaction {
  id: number;
  status: string;
  totalPrice: number;
  createdAt: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  product: {
    id: number;
    title: string;
    image: string;
    type: string;
    condition: string;
    sellerName: string;
  } | null;
}

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'success' | 'processing' | 'delivering' | 'review'>('all');
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      fetchTransactions();
    }
  }, [status, role]);

  const handleUpdateStatus = async (id: number, newStatus: string, redirectUrl?: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/transactions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Gagal memperbarui status');
      toast.success('Status transaksi berhasil diperbarui');
      
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        fetchTransactions();
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/transactions?role=${role}`);
      if (!res.ok) throw new Error('Gagal mengambil riwayat transaksi');
      const data = await res.json();
      setTransactions(data);
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'all') return true;
    return t.status === activeTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="success" className="gap-1"><CheckCircle className="w-3 h-3" /> Sudah Dibayar</Badge>;
      case 'processing':
        return <Badge variant="warning" className="gap-1"><Package className="w-3 h-3" /> Diproses</Badge>;
      case 'delivering':
        return <Badge variant="warning" className="gap-1"><Truck className="w-3 h-3" /> Dikirim</Badge>;
      case 'review':
        return <Badge variant="success" className="gap-1"><Star className="w-3 h-3 text-yellow-500" /> Selesai</Badge>;
      case 'pending':
        return <Badge variant="warning" className="gap-1"><Clock className="w-3 h-3" /> Menunggu</Badge>;
      case 'disputed':
        return <Badge variant="danger" className="gap-1 bg-red-100 text-red-700 border-red-200"><XCircle className="w-3 h-3" /> Komplain Diajukan</Badge>;
      case 'failed':
      case 'cancelled':
        return <Badge variant="danger" className="gap-1"><XCircle className="w-3 h-3" /> Gagal</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 lg:px-6">
        
        {/* Header */}
        <div className="bg-card rounded-3xl p-8 shadow-sm border border-border mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                <Package className="w-8 h-8 text-primary" />
                {role === 'buyer' ? 'Pembelian Saya' : 'Penjualan Saya'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {role === 'buyer' 
                  ? 'Lacak semua aktivitas pembelian dan permintaan hibah Anda.' 
                  : 'Kelola semua pesanan yang masuk ke toko Anda.'}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full lg:w-auto flex-wrap justify-end">
              {/* Role Toggle */}
              <div className="flex bg-muted p-1.5 rounded-xl w-full sm:w-auto shadow-inner shrink-0">
                <button
                  onClick={() => setRole('buyer')}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-black text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${role === 'buyer' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                >
                   Sebagai Pembeli
                </button>
                <button
                  onClick={() => setRole('seller')}
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-black text-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${role === 'seller' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                >
                   Sebagai Penjual
                </button>
              </div>

              {/* Simple Search/Filter visually */}
              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Cari transaksi..." 
                  className="pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-2 mt-8 pb-2 scrollbar-hide">
            {(['all', 'pending', 'success', 'processing', 'delivering', 'review'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                  activeTab === tab 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab === 'all' ? 'Semua' : 
                 tab === 'pending' ? 'Belum Dibayar' : 
                 tab === 'success' ? 'Sudah Dibayar' : 
                 tab === 'processing' ? 'Diproses' : 
                 tab === 'delivering' ? 'Dikirim' : 'Review Pesanan'}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction List */}
        <div className="space-y-4">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((trx) => (
              <div key={trx.id} className="bg-card rounded-3xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row gap-6">
                  
                  {/* Image */}
                  <div className="shrink-0">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-muted relative">
                      {trx.product?.image ? (
                        <img src={trx.product.image} alt={trx.product?.title} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                      <div className="absolute top-2 left-2">
                        {trx.product?.type === 'hibah' ? (
                          <Badge variant="success" className="text-[10px] uppercase shadow-sm">Hibah</Badge>
                        ) : (
                          <Badge variant="primary" className="text-[10px] uppercase shadow-sm">Beli</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                            TRX-{trx.id.toString().padStart(6, '0')}
                          </span>
                          <span className="text-gray-300"></span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(trx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-foreground mb-1 leading-tight">
                          {trx.product?.title || 'Produk Tidak Ditemukan'}
                        </h3>
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                          Penjual: <span className="font-bold text-foreground">{trx.product?.sellerName || 'Anonim'}</span>
                        </p>
                      </div>

                      <div className="text-left md:text-right flex flex-col md:items-end gap-2">
                        {getStatusBadge(trx.status)}
                        {trx.product?.type !== 'hibah' && (
                          <div className="mt-1">
                            <span className="text-xs text-muted-foreground uppercase font-bold block mb-0.5">Total Belanja</span>
                            <span className="text-xl font-black text-primary">
                              Rp {trx.totalPrice.toLocaleString('id-ID')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-6 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-full">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {trx.product?.type === 'hibah' 
                            ? 'Permintaan Hibah (Gratis)' 
                            : trx.paymentMethod 
                              ? `Metode: ${trx.paymentMethod.toUpperCase()}` 
                              : 'Menunggu Pembayaran'}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        {role === 'buyer' && trx.product && (
                          <Link 
                            href={`/checkout/${trx.product.id}`}
                            className="px-6 py-2 rounded-full border-2 border-border text-foreground font-bold text-sm hover:border-gray-300 transition-colors"
                          >
                            Beli Lagi
                          </Link>
                        )}
                        {role === 'buyer' && trx.status === 'review' && trx.product?.type !== 'hibah' && (
                          <Link 
                            href={`/review/${trx.id}`}
                            className="px-6 py-2 rounded-full bg-foreground hover:bg-foreground/90 text-background font-bold text-sm transition-colors shadow-md flex items-center gap-1.5"
                          >
                            <Star className="w-4 h-4 text-yellow-500" /> Beri Ulasan
                          </Link>
                        )}
                        {role === 'buyer' && trx.status === 'delivering' && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                if(confirm('Apakah Anda yakin barang rusak/tidak sesuai dan ingin mengajukan komplain? Uang akan ditahan oleh JUBAGI hingga masalah selesai.')) {
                                  handleUpdateStatus(trx.id, 'disputed');
                                }
                              }}
                              className="px-6 py-2 rounded-full bg-red-50 text-red-600 font-bold text-sm border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1.5"
                            >
                              Komplain
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(trx.id, 'review', `/review/${trx.id}`)}
                              className="px-6 py-2 rounded-full bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors shadow-md shadow-green-500/30 flex items-center gap-1.5"
                            >
                              <CheckCircle className="w-4 h-4" /> Pesanan Diterima
                            </button>
                          </div>
                        )}
                        {role === 'seller' && trx.status === 'success' && (
                          <button 
                            onClick={() => handleUpdateStatus(trx.id, 'processing')}
                            className="px-6 py-2 rounded-full bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors shadow-md shadow-blue-500/30 flex items-center gap-1.5"
                          >
                            <Package className="w-4 h-4" /> Proses Pesanan
                          </button>
                        )}
                        {role === 'seller' && trx.status === 'processing' && (
                          <button 
                            onClick={() => handleUpdateStatus(trx.id, 'delivering')}
                            className="px-6 py-2 rounded-full bg-indigo-500 text-white font-bold text-sm hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-500/30 flex items-center gap-1.5"
                          >
                            <Truck className="w-4 h-4" /> Kirim Barang
                          </button>
                        )}
                        {/* DEV SIMULATION BUTTONS FOR BUYER TO BYPASS SELLER ACTIONS */}
                        {role === 'buyer' && trx.status === 'success' && (
                          <button 
                            onClick={() => handleUpdateStatus(trx.id, 'processing')}
                            className="px-6 py-2 rounded-full border-2 border-blue-500 text-blue-500 font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm"
                          >
                            Simulasi Penjual Memproses (Dev)
                          </button>
                        )}
                        {role === 'buyer' && trx.status === 'processing' && (
                          <button 
                            onClick={() => handleUpdateStatus(trx.id, 'delivering')}
                            className="px-6 py-2 rounded-full border-2 border-indigo-500 text-indigo-500 font-bold text-sm hover:bg-indigo-50 transition-colors shadow-sm"
                          >
                            Simulasi Penjual Mengirim (Dev)
                          </button>
                        )}
                        {role === 'buyer' && trx.status === 'pending' && trx.product?.type !== 'hibah' && (
                          <>
                            <button onClick={() => handleUpdateStatus(trx.id, 'success')} className="px-6 py-2 rounded-full border-2 border-primary text-primary font-bold text-sm hover:bg-pink-50 transition-colors shadow-sm">
                              Simulasi Pembayaran (Dev)
                            </button>
                            <button className="px-6 py-2 rounded-full bg-primary text-white font-bold text-sm hover:bg-[#e06699] transition-colors shadow-md shadow-primary/30">
                              Bayar Sekarang
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-card rounded-3xl border border-border p-16 text-center shadow-sm">
              <Package className="w-20 h-20 text-gray-200 mx-auto mb-4" />
              <h3 className="text-2xl font-black text-foreground mb-2">Belum ada transaksi</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Kamu belum melakukan pembelian atau permintaan hibah. Yuk mulai cari barang impianmu di JUBAGI!
              </p>
              <Link 
                href="/"
                className="bg-foreground hover:bg-foreground/90 text-background font-bold px-8 py-4 rounded-full transition-all inline-block shadow-lg"
              >
                Mulai Belanja
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
