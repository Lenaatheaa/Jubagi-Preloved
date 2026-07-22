'use client';

import { useState, useEffect } from 'react';
import { Heart, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface LikedProduct {
  id: number;
  title: string;
  price: any;
  type: string;
  condition: string;
  location: string;
  images: { imageUrl: string }[];
  category: { name: string } | null;
}

export function WishlistView() {
  const [products, setProducts] = useState<LikedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/likes', { cache: 'no-store' })
      .then(async r => {
        const d = await r.json();
        if (r.ok && Array.isArray(d)) setProducts(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUnlike = async (productId: number) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-10 h-10 text-pink-200" />
        </div>
        <h3 className="font-black text-xl text-foreground">Wishlist masih kosong</h3>
        <p className="text-muted-foreground mt-2 text-sm">Tekan ikon hati di produk untuk menyimpannya di sini</p>
        <Link href="/" className="mt-6 px-6 py-3 bg-primary text-white font-bold rounded-2xl hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20">
          Jelajahi Produk
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map(product => {
        const image = product.images?.[0]?.imageUrl || '/placeholder.jpg';
        const isJual = product.type === 'jual';
        const price = product.price ? Number(product.price) : null;

        return (
          <div key={product.id} className="relative group">
            <Link href={`/products/${product.id}`} className="block">
              <div className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border flex flex-col h-full">
                <div className="relative h-56 w-full bg-muted overflow-hidden shrink-0">
                  <img src={image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 left-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${isJual ? 'bg-destructive' : 'bg-[#22C55E]'}`}>
                      {isJual ? 'Dijual' : 'Hibah'}
                    </span>
                  </div>
                  {/* Unlike button */}
                  <button
                    onClick={e => { e.preventDefault(); e.stopPropagation(); handleUnlike(product.id); }}
                    className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-red-500 transition-colors"
                    title="Hapus dari wishlist"
                  >
                    <Heart className="w-4 h-4 text-white fill-white" />
                  </button>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{product.category?.name || 'Lainnya'}</p>
                  <h3 className="font-semibold text-foreground leading-snug mb-3 line-clamp-2">{product.title}</h3>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                    <p className={`font-bold ${isJual ? 'text-foreground' : 'text-[#22C55E]'}`}>
                      {price ? `Rp ${price.toLocaleString('id-ID')}` : 'Gratis'}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {product.location}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}
