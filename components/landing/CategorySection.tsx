import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/categories';
import * as LucideIcons from 'lucide-react';

const renderIcon = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent ? <IconComponent className="w-7 h-7 drop-shadow-sm" fill="currentColor" strokeWidth={1.5} /> : <LucideIcons.Box className="w-7 h-7 drop-shadow-sm" fill="currentColor" strokeWidth={1.5} />;
};

export function CategorySection() {
  return (
    <section className="w-full py-20 bg-card">
       <div className="max-w-7xl mx-auto px-6 w-full">
           <div className="text-center flex flex-col items-center mb-16">
              <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                 Kategori Populer
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-foreground">
                 Temukan Sesuai <span className="text-primary">Kebutuhanmu</span>
              </h2>
              <p className="text-muted-foreground max-w-xl text-lg">
                 Ribuan barang berkualitas menanti - dari fashion hingga elektronik, semua ada di JUBAGI.
              </p>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6 mb-20">
              {CATEGORIES.slice(0, 10).map((cat) => {
               return (
                 <div key={cat.id} className="bg-card hover:bg-muted hover:shadow-lg hover:-translate-y-2 transition-all duration-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-border group cursor-pointer">
                   <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm ${cat.iconBgColor} border border-black/5 dark:border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-3xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{cat.emoji}</span>
                   </div>
                   <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{cat.name}</h3>
                 </div>
               );
             })}
           </div>
           
           <div className="bg-[#22C55E] rounded-[2rem] p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between shadow-xl shadow-[#22C55E]/20 relative overflow-hidden">
              {/* Decorative Circle */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-card/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
              
              <div className="text-white mb-6 md:mb-0 relative z-10 text-center md:text-left">
                 <h3 className="text-2xl lg:text-3xl font-bold mb-3">Ingin berbagi? Hibahkan barangmu!</h3>
                 <p className="text-green-50 text-lg opacity-90">Barang tidak terpakai bisa jadi berkah untuk orang lain.</p>
              </div>
              <button className="bg-card text-[#22C55E] font-bold px-8 py-4 rounded-xl hover:bg-green-50 transition-colors shadow-lg relative z-10 hover:-translate-y-1 whitespace-nowrap">
                 Lihat Hibah Gratis
              </button>
           </div>
       </div>
    </section>
  );
}
