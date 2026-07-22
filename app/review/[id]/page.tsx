'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Loader2, Package, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const toast = useToast();

  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (status === 'authenticated') {
      fetchTransaction();
    }
  }, [status]);

  const fetchTransaction = async () => {
    try {
      const res = await fetch(`/api/transactions?role=buyer`);
      if (!res.ok) throw new Error('Gagal memuat transaksi');
      const data = await res.json();
      const trx = data.find((t: any) => t.id.toString() === id);
      if (!trx || trx.status !== 'review') {
        toast.error('Transaksi tidak valid atau sudah direview');
        router.push('/transactions');
        return;
      }
      setTransaction(trx);
    } catch (error) {
      toast.error('Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Silakan pilih rating (1-5 Bintang)');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: transaction.id,
          productId: transaction.product.id,
          sellerId: transaction.product.sellerId,
          rating,
          comment
        })
      });

      if (!res.ok) throw new Error('Gagal mengirim ulasan');

      // Update status to 'completed' after review
      await fetch(`/api/transactions/${transaction.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      setSuccess(true);
      toast.success('Ulasan berhasil dikirim!');
      
      setTimeout(() => {
        router.push('/transactions');
      }, 2000);

    } catch (error: any) {
      toast.error(error.message);
      setSubmitting(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center pt-20">
        <div className="bg-card rounded-3xl p-10 text-center max-w-sm border border-border shadow-sm">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-foreground mb-2">Terima Kasih!</h2>
          <p className="text-muted-foreground text-sm">Ulasan kamu sangat membantu pengguna JUBAGI lainnya.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted pt-28 pb-20">
      <div className="max-w-2xl mx-auto px-4 lg:px-6">
        <h1 className="text-3xl font-black text-foreground mb-6">Beri Ulasan Pesanan</h1>
        
        <div className="bg-card rounded-3xl p-6 md:p-8 shadow-sm border border-border">
          {/* Product Info */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl mb-8">
            <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden shrink-0">
              {transaction?.product?.image ? (
                <img src={transaction.product.image} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-full h-full p-4 text-gray-400" />
              )}
            </div>
            <div>
              <p className="font-bold text-foreground leading-tight mb-1">{transaction?.product?.title}</p>
              <p className="text-xs text-muted-foreground">Penjual: {transaction?.product?.sellerName}</p>
            </div>
          </div>

          {/* Rating */}
          <div className="mb-8 text-center">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Bagaimana kepuasanmu?</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-12 h-12 transition-colors ${
                      (hoverRating || rating) >= star 
                        ? 'text-yellow-400 fill-yellow-400 drop-shadow-md' 
                        : 'text-gray-300'
                    }`} 
                  />
                </button>
              ))}
            </div>
            <p className="text-primary font-bold mt-3 h-6">
              {rating === 1 && 'Sangat Buruk'}
              {rating === 2 && 'Buruk'}
              {rating === 3 && 'Cukup Baik'}
              {rating === 4 && 'Puas'}
              {rating === 5 && 'Sangat Puas!'}
            </p>
          </div>

          {/* Comment */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-foreground mb-2">Tulis ulasanmu (opsional)</label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ceritakan pengalamanmu dengan produk dan penjual ini..."
              className="w-full bg-muted border border-border rounded-2xl p-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Ulasan'}
          </button>
        </div>
      </div>
    </div>
  );
}
