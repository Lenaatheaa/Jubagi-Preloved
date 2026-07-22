import { ShoppingCart, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Panduan Pembelian - JUBAGI',
  description: 'Cara belanja aman dan nyaman di JUBAGI.',
};

export default function BuyGuidePage() {
  return (
    <main className="min-h-screen bg-background pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 lg:px-6">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
            <ShoppingCart className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground">Panduan Pembelian</h1>
            <p className="text-muted-foreground">Belanja barang bekas berkualitas dengan aman</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 mb-8 shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-4">Langkah-langkah Membeli:</h2>
          <ol className="list-decimal list-inside space-y-4 text-muted-foreground leading-relaxed">
            <li><strong className="text-foreground">Cari Barang:</strong> Gunakan fitur pencarian dan filter untuk menemukan barang yang Anda inginkan.</li>
            <li><strong className="text-foreground">Cek Reputasi:</strong> Pastikan Anda membaca deskripsi barang, melihat foto dengan teliti, dan mengecek ulasan penjual.</li>
            <li><strong className="text-foreground">Tanya Penjual (Opsional):</strong> Gunakan fitur Chat untuk menanyakan detail atau ketersediaan barang.</li>
            <li><strong className="text-foreground">Checkout & Bayar:</strong> Klik "Beli Sekarang", isi alamat, dan lakukan pembayaran (Didukung oleh QRIS, Virtual Account, dll via Midtrans).</li>
            <li><strong className="text-foreground">Terima Barang:</strong> Tunggu barang dikirim. Setelah sampai, periksa dengan teliti. Jika sesuai, klik "Pesanan Diterima".</li>
          </ol>
        </div>

        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-3xl p-8">
          <div className="flex items-start gap-4">
            <ShieldCheck className="w-8 h-8 text-green-600 shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-green-800 dark:text-green-400 mb-2">Perlindungan Pembeli (Escrow)</h3>
              <p className="text-green-700 dark:text-green-500/80 leading-relaxed">
                Uang yang Anda bayarkan tidak akan langsung masuk ke penjual. Uang akan ditahan di rekening bersama JUBAGI hingga Anda menerima barang dan memastikan semuanya sesuai deskripsi. Jika barang rusak atau tidak sesuai, Anda bisa mengajukan komplain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
