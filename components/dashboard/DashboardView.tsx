'use client';

import { useRef } from 'react';
import { ArrowRight, ChevronDown, ChevronRight, Flame } from 'lucide-react';
import { ProductCard } from '../product/ProductCard';
import { useProduct } from '@/hooks/useProduct';
import { useProductsInfinite } from '@/hooks/useProductsInfinite';
import { AdCarousel } from './AdCarousel';
import { CATEGORIES } from '@/lib/categories';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { INLINE_BANNERS } from '@/lib/banners';
import { InlineBanner } from '@/components/ads/InlineBanner';

const renderIcon = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName];
  return IconComponent ? <IconComponent className="w-14 h-14 drop-shadow-sm" fill="currentColor" strokeWidth={1.5} /> : <LucideIcons.Box className="w-14 h-14 drop-shadow-sm" fill="currentColor" strokeWidth={1.5} />;
};

export function DashboardView() {
  // Satu hook untuk semua data produk - menghindari 2 API call terpisah
  const { products, loading } = useProduct();
  const { 
    products: recoProducts, 
    loading: loadingReco, 
    loadingMore: loadingMoreReco, 
    hasMore: hasMoreReco, 
    loadMore: loadMoreReco 
  } = useProductsInfinite({ limit: 12 });
  
  const exploreRef = useRef<HTMLDivElement>(null);
  
  const scrollExplore = () => {
    if (exploreRef.current) {
      exploreRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 pt-24 pb-20 space-y-12 lg:space-y-16">
      
      {/* Ad Carousel Section */}
      <section>
        <AdCarousel />
      </section>

      {/* Section 1: Sepertinya ini tipe hal yang kamu sukai */}
      <section>
        <div className="flex items-end justify-between mb-6">
           <h2 className="text-2xl font-black text-foreground tracking-tight">
             Sepertinya ini tipe hal yang <span className="text-primary">kamu sukai.</span>
           </h2>
           <Link href="/products" className="text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 group">
             Lihat semua <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
           </Link>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.slice(0, 5).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Explore Jubagi */}
      <section className="relative">
        <h2 className="text-2xl font-black text-foreground tracking-tight mb-6">
          Explore <span className="text-primary">Jubagi</span>
        </h2>
        
        <div 
          ref={exploreRef}
          className="flex items-center gap-6 overflow-hidden pb-4 snap-x scroll-smooth px-2"
        >
          {CATEGORIES.map((cat, i) => (
            <Link href={`/products?category=${cat.id}`} key={i} className="flex flex-col items-center gap-4 shrink-0 snap-center group cursor-pointer w-28">
               <div className={`w-16 h-16 flex items-center justify-center rounded-2xl ${cat.iconBgColor} group-hover:scale-110 group-hover:drop-shadow-lg transition-all duration-300 shadow-sm border border-black/5 dark:border-white/5`}>
                  <span className="text-3xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300">{cat.emoji}</span>
               </div>
               <span className="text-sm font-bold text-center text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                  {cat.name}
               </span>
            </Link>
          ))}
        </div>

        {/* Scroll Left Button */}
        <button 
          onClick={() => exploreRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
          className="absolute left-0 top-[60%] -translate-y-1/2 w-12 h-12 bg-card/90 hover:bg-card backdrop-blur-md rounded-full flex items-center justify-center text-foreground shadow-xl border border-border hover:scale-110 transition-all z-10 hidden md:flex"
        >
          <ChevronDown className="w-6 h-6 rotate-90" />
        </button>

        {/* Scroll Right Button */}
        <button 
          onClick={scrollExplore}
          className="absolute right-0 top-[60%] -translate-y-1/2 w-12 h-12 bg-card/90 hover:bg-card backdrop-blur-md rounded-full flex items-center justify-center text-foreground shadow-xl border border-border hover:scale-110 transition-all z-10 hidden md:flex"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </section>

      {/* Section 3: Hot Items */}
      <section className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-12 rounded-3xl border border-red-100 dark:border-red-900/30">
        <div className="flex items-end justify-between mb-8">
           <div>
             <div className="flex items-center gap-2 mb-2">
               <Flame className="w-5 h-5 text-red-500 fill-red-500 animate-pulse" />
               <span className="text-red-500 font-bold text-sm tracking-wider uppercase">Sedang Tren</span>
             </div>
             <h2 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">
               Barang <span className="text-red-500">Hot</span> Saat Ini
             </h2>
           </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-gray-300 border-t-red-500 rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Mengambil produk hot (simulasi slice berbeda) */}
            {products.slice(4, 9).map(product => (
              <ProductCard key={`hot-${product.id}`} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Section 4: Pilihan harian anda */}
      <section className="bg-muted -mx-4 lg:-mx-6 px-4 lg:px-6 py-12 rounded-3xl">
        <div className="flex items-end justify-between mb-8">
           <div>
             <span className="text-primary font-bold text-sm tracking-wider uppercase mb-2 block">Special For You</span>
             <h2 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">
               Pilihan harian anda
             </h2>
           </div>
           <button className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 group bg-card px-4 py-2 rounded-lg shadow-sm border border-border">
             Kategori Fashion <ChevronDown className="w-4 h-4" />
           </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.slice(2, 8).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Section 5: Rekomendasi untuk anda */}
      <section>
        <div className="text-center mb-8">
           <h2 className="text-2xl lg:text-3xl font-black text-foreground tracking-tight">
             Rekomendasi untuk anda
           </h2>
           <p className="text-muted-foreground mt-2">Disesuaikan dengan riwayat pencarian dan minatmu.</p>
        </div>
        
        {loadingReco ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6 mb-12">
            {recoProducts.map((product, index) => {
              // Menampilkan banner setiap 15 produk (3 baris di desktop) agar jaraknya jauh
              const SHOW_BANNER_EVERY = 15;
              let banner = null;
              
              if ((index + 1) % SHOW_BANNER_EVERY === 0 && INLINE_BANNERS.length > 0) {
                // Rotasi banner secara berurutan (0, 1, 2, kembali ke 0)
                const bannerIndex = ((index + 1) / SHOW_BANNER_EVERY - 1) % INLINE_BANNERS.length;
                banner = INLINE_BANNERS[bannerIndex];
              }
              
              return (
                <React.Fragment key={product.id}>
                  <ProductCard product={product} />
                  {banner && <InlineBanner banner={banner} />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {hasMoreReco && (
          <div className="flex justify-center">
             <button 
               onClick={loadMoreReco}
               disabled={loadingMoreReco}
               className="bg-card border-2 border-border text-foreground hover:border-foreground font-bold py-3 px-8 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2 group disabled:opacity-60"
             >
                {loadingMoreReco ? (
                  <>
                    Memuat... <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  <>
                    Lihat Lebih Banyak <ChevronDown className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
             </button>
          </div>
        )}
      </section>

    </div>
  );
}
