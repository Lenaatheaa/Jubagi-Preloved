'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Gift, ShoppingBag } from 'lucide-react';

export function HeroSection() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query)}`);
    }
  };
  return (
    <section className="relative w-full min-h-[85vh] flex items-center pt-24 pb-20 overflow-hidden bg-gradient-to-b from-[#FFF5F8]/40 to-white">
      {/* Background Gradient Blob */}
      <div className="absolute top-0 right-0 w-full lg:w-2/3 h-full bg-gradient-to-bl from-[#FCD8CD]/30 to-transparent rounded-bl-full -z-10 blur-3xl opacity-70" />
      
      <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Column: Text & CTA */}
        <div className="flex flex-col gap-6 w-full">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full w-fit">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="font-medium text-sm">Marketplace Barang Bekas & Hibah #1</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.15] text-foreground">
            Temukan Barang Bekas <span className="text-primary relative inline-block whitespace-nowrap">
              Berkualitas
              <svg className="absolute w-full h-3 md:h-4 -bottom-1 md:-bottom-2 left-0 text-[#FCD8CD]" viewBox="0 0 100 20" preserveAspectRatio="none" fill="currentColor">
                 <path d="M0,10 Q50,20 100,10 L100,20 L0,20 Z" />
              </svg>
            </span> <br className="hidden lg:block" />& Berbagi Lewat <span className="text-[#22C55E]">Hibah</span>
          </h1>
          
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl leading-relaxed">
            Jual, beli, atau hibahkan barang dengan mudah dan aman. Bergabung bersama ribuan pengguna yang sudah merasakan manfaatnya.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex bg-card p-2 rounded-full shadow-lg shadow-gray-100 border border-border max-w-xl items-center mt-2 w-full">
            <Search className="w-6 h-6 text-muted-foreground ml-4 shrink-0" />
            <input 
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari produk, kategori..." 
              className="flex-1 bg-transparent border-none outline-none px-4 text-foreground w-full" 
            />
            <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-6 md:px-8 py-3 rounded-full font-medium transition-transform hover:scale-105 shrink-0">
              Cari
            </button>
          </form>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mt-4">
            <button className="bg-gradient-to-r from-primary to-pink-400 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all hover:-translate-y-1 flex items-center gap-2">
              Jelajahi Produk <ArrowRight className="w-4 h-4" />
            </button>
            <button className="bg-destructive text-white px-8 py-3 rounded-xl font-medium shadow-lg shadow-destructive/30 hover:shadow-destructive/40 transition-all hover:-translate-y-1">
              Jual Barang
            </button>
            <button className="bg-card border-2 border-[#22C55E] text-[#22C55E] px-6 py-3 rounded-xl font-medium shadow-sm hover:bg-green-50 transition-all hover:-translate-y-1 flex items-center gap-2">
              <Gift className="w-5 h-5" /> Hibah Barang
            </button>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap items-center gap-8 md:gap-10 mt-6">
             <div>
                <p className="text-3xl font-bold text-foreground">10K+</p>
                <p className="text-sm text-muted-foreground font-medium">Produk Aktif</p>
             </div>
             <div>
                <p className="text-3xl font-bold text-foreground">5K+</p>
                <p className="text-sm text-muted-foreground font-medium">Pengguna</p>
             </div>
             <div>
                <p className="text-3xl font-bold text-foreground">500+</p>
                <p className="text-sm text-muted-foreground font-medium">Hibah Sukses</p>
             </div>
          </div>
        </div>
        
        {/* Right Column: Image Presentation */}
        <div className="relative w-full flex items-center justify-center mt-12 lg:mt-0 min-h-[400px] lg:min-h-[600px]">
            {/* Main Image Container */}
            <div className="w-[90%] md:w-[70%] lg:w-[80%] aspect-[4/5] bg-[#E2E8F0] rounded-3xl shadow-2xl relative overflow-hidden flex-shrink-0 border-4 border-white">
                 <img src="https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=800&q=80" alt="Hero Illustration" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* Floating Badges */}
            <div className="absolute top-[10%] left-0 md:-left-4 bg-card p-3 md:p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce" style={{animationDuration: '3s'}}>
               <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <ShoppingBag className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-xs md:text-sm font-bold text-foreground">Terjual!</p>
                 <p className="text-[10px] md:text-xs text-muted-foreground">Sneakers Nike</p>
               </div>
            </div>

            <div className="absolute top-[40%] right-0 md:-right-8 bg-card p-4 rounded-xl shadow-xl text-center hover:-translate-y-1 transition-transform">
                <p className="text-[#22C55E] font-bold text-lg md:text-xl">Gratis</p>
                <p className="text-xs text-muted-foreground">via Hibah</p>
            </div>
            
            <div className="absolute bottom-[10%] right-[10%] md:-right-4 bg-card p-3 md:p-4 rounded-xl shadow-xl flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Gift className="w-5 h-5" />
               </div>
               <div>
                 <p className="text-xs md:text-sm font-bold text-foreground">Hibah Baru</p>
                 <p className="text-[10px] md:text-xs text-muted-foreground">Kursi Makan</p>
               </div>
            </div>
        </div>
      </div>
    </section>
  );
}
