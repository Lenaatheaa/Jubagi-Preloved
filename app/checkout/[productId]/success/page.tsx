'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { use, Suspense } from 'react';
import { CheckCircle2, ShoppingBag, Home, ArrowRight } from 'lucide-react';

function SuccessContent({ productId }: { productId: string }) {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('id');
  const isHibah = searchParams.get('hibah') === '1';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 dark:from-background dark:via-background dark:to-primary/10 flex items-center justify-center px-4 pt-20">
      <div className="max-w-md w-full">

        {/* Kartu sukses */}
        <div className="bg-card rounded-3xl border border-border shadow-xl overflow-hidden text-center">

          {/* Header banner */}
          <div className={`px-8 py-10 ${isHibah ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-primary to-pink-600'}`}>
            <div className="w-20 h-20 bg-card/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              {isHibah
                ? <span className="text-4xl"></span>
                : <CheckCircle2 className="w-10 h-10 text-white" />
              }
            </div>
            <h1 className="text-2xl font-black text-white mb-1">
              {isHibah ? 'Hibah Berhasil!' : 'Pembayaran Berhasil!'}
            </h1>
            <p className="text-white/80 text-sm">
              {isHibah
                ? 'Pengajuan hibah Anda telah tercatat.'
                : 'Transaksi Anda sedang diproses oleh penjual.'}
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-7 space-y-5">
            {transactionId && (
              <div className="bg-muted rounded-2xl p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">ID Transaksi</p>
                <p className="font-mono font-bold text-foreground text-sm">#{transactionId.padStart(6, '0')}</p>
              </div>
            )}

            <div className="space-y-3 text-left text-sm">
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isHibah ? 'bg-green-100' : 'bg-pink-100'}`}>
                  <span className={`text-xs font-black ${isHibah ? 'text-green-600' : 'text-primary'}`}>1</span>
                </div>
                <div>
                  <p className="font-bold text-foreground">{isHibah ? 'Pengajuan diterima' : 'Pembayaran dikonfirmasi'}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{isHibah ? 'Kami telah mencatat pengajuan hibah Anda.' : 'Dana Anda aman tersimpan di escrow JUBAGI.'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-black text-muted-foreground">2</span>
                </div>
                <div>
                  <p className="font-bold text-foreground">Penjual dinotifikasi</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{isHibah ? 'Penjual akan memproses permintaan hibah Anda.' : 'Penjual sedang mempersiapkan barang untuk dikirim.'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-black text-muted-foreground">3</span>
                </div>
                <div>
                  <p className="font-bold text-foreground">Barang dalam perjalanan</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Anda akan mendapat notifikasi saat barang dikirim.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Link
                href="/transactions"
                className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:-translate-y-0.5 ${isHibah ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20' : 'bg-foreground hover:bg-foreground/90 text-background shadow-gray-900/20'}`}
              >
                <ShoppingBag className="w-4 h-4" /> Lihat Transaksi Saya <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 border-2 border-border text-muted-foreground hover:border-gray-300 hover:bg-muted transition-all"
              >
                <Home className="w-4 h-4" /> Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Ada pertanyaan? Hubungi kami melalui fitur <span className="text-primary font-semibold">Chat</span> di halaman produk.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent productId={productId} />
    </Suspense>
  );
}
