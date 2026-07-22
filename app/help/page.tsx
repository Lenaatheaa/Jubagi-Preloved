import { HelpCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Pusat Bantuan & FAQ - JUBAGI',
  description: 'Temukan jawaban untuk pertanyaan yang sering diajukan di JUBAGI.',
};

export default function FAQPage() {
  const faqs = [
    {
      q: 'Apa itu JUBAGI?',
      a: 'JUBAGI adalah platform marketplace barang bekas yang menggabungkan fitur jual-beli aman (rekening bersama) dan program sosial hibah (pemberian barang gratis) dalam satu wadah.'
    },
    {
      q: 'Apakah uang saya aman saat membeli?',
      a: 'Sangat aman! JUBAGI menggunakan sistem Escrow (Rekening Bersama). Uang Anda akan ditahan oleh sistem kami dan baru akan diteruskan ke penjual SETELAH Anda menekan tombol "Pesanan Diterima".'
    },
    {
      q: 'Bagaimana cara melakukan penarikan saldo (Withdraw)?',
      a: 'Masuk ke menu Profil > Dompet, lalu klik "Tarik Saldo". Masukkan nominal (minimal Rp 10.000) dan data rekening Anda. Tim kami akan memprosesnya dalam 1x24 jam.'
    },
    {
      q: 'Apa bedanya "Dijual" dan "Dihibahkan"?',
      a: 'Barang "Dijual" berarti Anda harus membayarnya sesuai harga yang tertera. Sedangkan barang "Dihibahkan" adalah barang gratis yang diberikan oleh pemiliknya secara cuma-cuma, Anda hanya perlu mengajukan permintaan.'
    }
  ];

  return (
    <main className="min-h-screen bg-background pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 lg:px-6">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
            <HelpCircle className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground">Pusat Bantuan (FAQ)</h1>
            <p className="text-muted-foreground">Pertanyaan yang sering diajukan</p>
          </div>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-2">{faq.q}</h3>
              <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-primary/5 border border-primary/20 rounded-3xl p-8 text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Masih Butuh Bantuan?</h2>
          <p className="text-muted-foreground mb-6">Tim Customer Service kami siap membantu Anda 24/7.</p>
          <a href="mailto:support@jubagi.com" className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors">
            Hubungi Customer Service
          </a>
        </div>
      </div>
    </main>
  );
}
