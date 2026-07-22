import { Store, CheckCircle2 } from 'lucide-react';

export const metadata = {
  title: 'Panduan Berjualan - JUBAGI',
  description: 'Pelajari cara menjual barang dengan cepat dan aman di JUBAGI.',
};

export default function SellGuidePage() {
  const steps = [
    { title: 'Siapkan Foto Terbaik', desc: 'Ambil foto barang dari berbagai sudut dengan pencahayaan yang terang. Foto yang bagus meningkatkan peluang terjual hingga 3x lipat.' },
    { title: 'Tulis Deskripsi Jujur', desc: 'Sebutkan minus (jika ada), kelengkapan, dan alasan dijual. Kejujuran akan menghindarkan Anda dari retur dan komplain.' },
    { title: 'Tentukan Harga Menarik', desc: 'Riset harga pasaran barang bekas yang serupa. Berikan harga yang masuk akal agar cepat laku.' },
    { title: 'Kirim Tepat Waktu', desc: 'Saat ada pesanan masuk, segera kemas barang dengan aman dan kirim melalui jasa ekspedisi. Update resi di menu Transaksi.' },
    { title: 'Cairkan Saldo', desc: 'Setelah pembeli mengonfirmasi pesanan diterima, dana akan otomatis masuk ke Dompet JUBAGI Anda dan siap ditarik ke rekening.' }
  ];

  return (
    <main className="min-h-screen bg-background pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 lg:px-6">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/30 rounded-2xl flex items-center justify-center">
            <Store className="w-7 h-7 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground">Panduan Berjualan</h1>
            <p className="text-muted-foreground">Ubah barang tak terpakai jadi cuan</p>
          </div>
        </div>

        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {steps.map((step, i) => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-4 border-background bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <span className="font-bold">{i + 1}</span>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-card border border-border shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h3 className="font-bold text-foreground text-lg">{step.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
