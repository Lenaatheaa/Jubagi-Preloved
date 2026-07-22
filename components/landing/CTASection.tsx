import { Shield, Coins, Gift } from 'lucide-react';

export function CTASection() {
  return (
    <section className="px-6 lg:px-20 py-24 bg-card">
       <div className="max-w-4xl mx-auto w-full text-center flex flex-col items-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
          
          <div className="bg-primary/10 text-primary px-5 py-2 rounded-full text-sm font-medium mb-8">
             Gratis mendaftar
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-black mb-6 tracking-tight text-foreground">
             Siap untuk <span className="text-primary relative inline-block">Gabung
               <svg className="absolute w-full h-4 -bottom-2 left-0 text-[#FCD8CD]" viewBox="0 0 100 20" preserveAspectRatio="none" fill="currentColor">
                  <path d="M0,10 Q50,20 100,10 L100,20 L0,20 Z" />
               </svg>
             </span> Sekarang?
          </h2>
          
          <p className="text-muted-foreground text-lg mb-12 max-w-2xl leading-relaxed">
             Daftarkan diri kamu secara gratis dan mulai menjelajahi ribuan produk bekas berkualitas, atau mulai jual barang lamamu hari ini!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full sm:w-auto">
             <button className="bg-primary text-white font-bold px-8 py-4 rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary/90 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                Daftar Gratis Sekarang &rarr;
             </button>
             <button className="bg-card text-foreground font-bold px-8 py-4 rounded-2xl shadow-sm border border-border hover:bg-muted hover:-translate-y-1 transition-all w-full sm:w-auto">
                Sudah punya akun? Masuk
             </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 w-full justify-center">
             <div className="bg-muted rounded-2xl p-5 flex items-center gap-4 border border-border flex-1 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                   <Shield className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-foreground text-left">Transaksi aman & terpercaya</p>
             </div>
             <div className="bg-muted rounded-2xl p-5 flex items-center gap-4 border border-border flex-1 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
                   <Coins className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-foreground text-left">Gratis mendaftar & upload produk</p>
             </div>
             <div className="bg-muted rounded-2xl p-5 flex items-center gap-4 border border-border flex-1 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-pink-100 text-primary flex items-center justify-center shrink-0">
                   <Gift className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-foreground text-left">Fitur hibah untuk berbagi</p>
             </div>
          </div>
       </div>
    </section>
  );
}
