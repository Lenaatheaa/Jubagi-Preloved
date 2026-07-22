import { HeartHandshake } from 'lucide-react';

export const metadata = {
  title: 'Cara Menerima Hibah - JUBAGI',
  description: 'Panduan lengkap cara mengajukan dan menerima barang hibah secara gratis.',
};

export default function HibahGuidePage() {
  return (
    <main className="min-h-screen bg-background pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 lg:px-6">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
            <HeartHandshake className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground">Cara Menerima Hibah</h1>
            <p className="text-muted-foreground">Dapatkan barang gratis dari pemberi yang baik hati</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-4">Apa itu Hibah?</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Program Hibah adalah inisiatif sosial JUBAGI di mana pengguna dapat membagikan barang-barang yang sudah tidak mereka pakai kepada orang lain yang lebih membutuhkan secara <strong>gratis</strong> (Rp 0).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Anda hanya perlu membayar biaya pengiriman (jika melalui kurir) atau mengambilnya langsung (jika metode ambil di rumah).
            </p>
          </div>

          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-4">Alur Mengambil Hibah</h2>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                <p className="text-sm text-muted-foreground">Cari produk dengan label <strong className="text-emerald-500">Hibah</strong>.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
                <p className="text-sm text-muted-foreground">Klik tombol <strong>Ajukan Permintaan Hibah</strong> dan tuliskan alasan mengapa Anda membutuhkannya.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
                <p className="text-sm text-muted-foreground">Pemberi akan meninjau alasan Anda dan memilih siapa yang berhak mendapatkan.</p>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</span>
                <p className="text-sm text-muted-foreground">Jika disetujui, Anda bisa melakukan <strong>Checkout Pengiriman</strong> secara otomatis melalui Chat.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
