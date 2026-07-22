'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProductsInfinite } from '@/hooks/useProductsInfinite';
import { ProductCard } from '@/components/product/ProductCard';
import { PROVINCES } from '@/lib/provinces';
import { CATEGORIES } from '@/lib/categories';
import { Search, SlidersHorizontal, RefreshCw, X, HelpCircle, Loader2 } from 'lucide-react';
import React, { Suspense } from 'react';
import { INLINE_BANNERS } from '@/lib/banners';
import { InlineBanner } from '@/components/ads/InlineBanner';

const CONDITIONS = [
  { value: 'brand_new', label: 'Baru' },
  { value: 'like_new', label: 'Seperti Baru' },
  { value: 'lightly_used', label: 'Jarang Dipakai' },
  { value: 'well_used', label: 'Sering Dipakai' },
  { value: 'heavily_used', label: 'Sangat Sering Dipakai' }
];

function ProductsCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Ambil inisialisasi filter dari URL query params
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [location, setLocation] = useState(searchParams.get('location') || 'Seluruh Indonesia');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');

  // Hook untuk mengambil produk terpaginasi
  const {
    products,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    reset
  } = useProductsInfinite({
    q,
    category,
    location,
    type,
    condition,
    limit: 12
  });

  // Sinkronkan filter ke URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (location && location !== 'Seluruh Indonesia') params.set('location', location);
    if (type) params.set('type', type);
    if (condition) params.set('condition', condition);

    const queryString = params.toString();
    router.replace(`/products${queryString ? '?' + queryString : ''}`, { scroll: false });
  }, [q, category, location, type, condition, router]);

  // Observer untuk automatic lazy loading (infinite scroll)
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, loading, loadingMore, loadMore]);

  // Reset semua filter ke default
  const handleResetFilters = () => {
    setQ('');
    setCategory('');
    setLocation('Seluruh Indonesia');
    setType('');
    setCondition('');
  };

  return (
    <div className="w-full bg-muted min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-border/80 gap-4">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">
              Katalog <span className="text-primary">Produk</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Temukan barang bekas berkualitas tinggi dan hibah gratis di sekitarmu.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleResetFilters}
              className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 bg-card border border-border px-3 py-2 rounded-xl shadow-sm hover:border-primary/30"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/*  FILTER SIDEBAR (Kiri)  */}
          <div className="lg:col-span-1">
            <div className="bg-card p-6 rounded-3xl border border-border shadow-sm space-y-6 sticky top-[140px] self-start max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide">
              
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="font-bold text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" /> Filter Pencarian
                </span>
              </div>

              {/* Pencarian Teks */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kata Kunci</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari barang..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-card transition-all"
                  />
                  {q && (
                    <button 
                      onClick={() => setQ('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tipe Transaksi */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Tipe Produk</label>
                <div className="grid grid-cols-3 gap-2 bg-muted p-1 rounded-xl">
                  <button
                    onClick={() => setType('')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      type === '' 
                        ? 'bg-card text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setType('jual')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      type === 'jual' 
                        ? 'bg-card text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Dijual
                  </button>
                  <button
                    onClick={() => setType('hibah')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                      type === 'hibah' 
                        ? 'bg-card text-green-600 shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Hibah
                  </button>
                </div>
              </div>

              {/* Kategori */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-card transition-all cursor-pointer font-medium text-foreground"
                >
                  <option value="">Semua Kategori</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lokasi Provinsi */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Lokasi (Provinsi)</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-card transition-all cursor-pointer font-medium text-foreground"
                >
                  {PROVINCES.map((prov, idx) => (
                    <option key={idx} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              {/* Kondisi */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Kondisi Barang</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-card transition-all cursor-pointer font-medium text-foreground"
                >
                  <option value="">Semua Kondisi</option>
                  {CONDITIONS.map((cond) => (
                    <option key={cond.value} value={cond.value}>
                      {cond.label}
                    </option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* === DAFTAR PRODUK GRID (Kanan) === */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Keadaan loading awal */}
            {loading && products.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-card rounded-3xl border border-border p-4 space-y-4 animate-pulse">
                    <div className="w-full aspect-square bg-gray-200 rounded-2xl" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              
              /* Keadaan data kosong */
              <div className="bg-card rounded-3xl border border-border py-20 px-6 text-center shadow-sm flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                  <HelpCircle className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Produk Tidak Ditemukan</h3>
                <p className="text-muted-foreground text-sm max-w-sm">Maaf, kami tidak menemukan barang yang sesuai dengan kriteria filter Anda. Silakan ubah filter atau kata kunci Anda.</p>
                <button 
                  onClick={handleResetFilters}
                  className="mt-6 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-primary/20 text-sm"
                >
                  Reset Semua Filter
                </button>
              </div>
            ) : (
              
              /* Render produk terfilter */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {products.map((product, index) => {
                    // Menampilkan banner setiap 12 produk (4 baris di desktop)
                    const SHOW_BANNER_EVERY = 12;
                    let banner = null;
                    
                    if ((index + 1) % SHOW_BANNER_EVERY === 0 && INLINE_BANNERS.length > 0) {
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

                {/* Sentinel div untuk deteksi infinite loading scroll */}
                <div ref={sentinelRef} className="h-10 w-full flex items-center justify-center">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                      <Loader2 className="w-5 h-5 animate-spin" /> Memuat barang lainnya...
                    </div>
                  )}
                </div>
              </>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="w-full bg-muted min-h-screen pt-32 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground font-bold text-sm">Memuat Katalog JUBAGI...</p>
        </div>
      </div>
    }>
      <ProductsCatalogContent />
    </Suspense>
  );
}
