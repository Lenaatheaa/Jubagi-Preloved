'use client';

import { useState, useEffect } from 'react';
import { Heart, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export interface Product {
  id: string | number;
  type: 'jual' | 'hibah';
  condition: string;
  category: string;
  title: string;
  price: number | 'Gratis';
  location: string;
  image: string;
  isBoosted?: boolean;
}

// Cache global agar tidak fetch berulang per-card
let likedIdsCache: Set<number> | null = null;
let likedIdsFetching: Promise<Set<number>> | null = null;

async function getLikedIds(): Promise<Set<number>> {
  if (likedIdsCache !== null) return likedIdsCache;
  if (!likedIdsFetching) {
    likedIdsFetching = fetch('/api/likes', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : [])
      .then((products: any[]) => {
        likedIdsCache = new Set(Array.isArray(products) ? products.map((p: any) => Number(p.id)) : []);
        likedIdsFetching = null;
        return likedIdsCache;
      })
      .catch(() => {
        likedIdsFetching = null;
        likedIdsCache = new Set();
        return likedIdsCache;
      });
  }
  return likedIdsFetching;
}

// Expose to reset cache after like toggle
export function invalidateLikeCache() {
  likedIdsCache = null;
  likedIdsFetching = null;
}

const CONDITION_LABELS: Record<string, string> = {
  brand_new: 'Baru',
  like_new: 'Seperti Baru',
  lightly_used: 'Jarang Dipakai',
  well_used: 'Sering Dipakai',
  heavily_used: 'Sangat Sering Dipakai',
};

export function ProductCard({ product }: { product: Product }) {
  const { data: session } = useSession();
  const isJual = product.type === 'jual';
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Load initial like state from DB
  useEffect(() => {
    if (!session) return;
    getLikedIds().then(ids => {
      setLiked(ids.has(Number(product.id)));
    });
  }, [session, product.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session || likeLoading) return;

    const next = !liked;
    setLiked(next);
    setLikeLoading(true);

    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      });
      // Update cache
      if (likedIdsCache) {
        if (next) likedIdsCache.add(Number(product.id));
        else likedIdsCache.delete(Number(product.id));
      }
    } catch {
      setLiked(!next); // revert on error
    } finally {
      setLikeLoading(false);
    }
  };

  return (
    <Link href={`/products/${product.id}`} className="block group h-full">
      <div className={`bg-card text-card-foreground rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col h-full ${product.isBoosted ? 'border-2 border-amber-400' : 'border border-border'}`}>
        <div className="relative h-56 w-full bg-muted overflow-hidden shrink-0">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            <span className={`w-fit px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${isJual ? 'bg-destructive' : 'bg-[#22C55E]'}`}>
              {isJual ? 'Dijual' : 'Hibah'}
            </span>
          </div>
          <button
            onClick={handleLike}
            className={`absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90 ${
              liked ? 'bg-primary text-white scale-110' : 'bg-card text-card-foreground text-muted-foreground hover:text-primary'
            }`}
          >
            <Heart className={`w-4 h-4 transition-all ${liked ? 'fill-white' : ''}`} />
          </button>
        </div>
        <div className="p-4 flex flex-col flex-1">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{product.category}</p>
          <h3 className="font-semibold text-foreground leading-snug mb-2 line-clamp-2">{product.title}</h3>
          
          <div className="flex items-center gap-1.5 mb-3 flex-wrap mt-auto">
            {product.isBoosted && (
              <span className="w-fit px-2 py-0.5 rounded text-[10px] font-black uppercase text-amber-900 bg-amber-400 flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                </span>
                BOOST
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border">
              {CONDITION_LABELS[product.condition] || product.condition}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-border">
            <p className={`font-bold ${isJual ? 'text-foreground dark:text-foreground' : 'text-[#22C55E]'}`}>
              {typeof product.price === 'number' ? `Rp ${product.price.toLocaleString('id-ID')}` : 'Gratis'}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {product.location}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
