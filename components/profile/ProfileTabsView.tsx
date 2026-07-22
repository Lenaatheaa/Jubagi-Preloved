'use client';

import { useState, useEffect } from 'react';
import { Package, Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/product/ProductCard';

interface ProfileTabsViewProps {
  userId: number;
  formattedProducts: any[];
}

export function ProfileTabsView({ userId, formattedProducts }: ProfileTabsViewProps) {
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0) {
      fetchReviews();
    }
  }, [activeTab]);

  const fetchReviews = async () => {
    try {
      setIsLoadingReviews(true);
      const res = await fetch(`/api/reviews?sellerId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews', error);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-border mb-8 px-2">
        <button 
          onClick={() => setActiveTab('listings')}
          className={`pb-4 font-bold text-sm transition-colors ${
            activeTab === 'listings' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Listings ({formattedProducts.length})
        </button>
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`pb-4 font-bold text-sm transition-colors flex items-center gap-2 ${
            activeTab === 'reviews' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Reviews 
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'listings' ? (
        <div>
          {formattedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {formattedProducts.map(product => (
                <ProductCard key={product.id} product={product as any} />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-3xl border border-border p-12 text-center shadow-sm">
              <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Belum ada barang</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Kamu belum mengunggah barang untuk dijual atau dihibahkan. Yuk mulai berbagi sekarang!
              </p>
              <Link 
                href="/jual"
                className="bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-full transition-all text-sm inline-block shadow-lg shadow-primary/30"
              >
                Upload Barang Pertama
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {isLoadingReviews ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map(review => (
                <div key={review.id} className="bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
                          {review.reviewerAvatar ? (
                            <img src={review.reviewerAvatar} alt={review.reviewerName} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            review.reviewerName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm">{review.reviewerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                    
                    <p className="text-foreground italic text-sm mb-4">"{review.comment}"</p>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-50 flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground line-clamp-1">{review.productTitle}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-3xl border border-border p-12 text-center shadow-sm">
              <MessageSquare className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Belum ada ulasan</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Toko ini belum mendapatkan ulasan dari pembeli.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
