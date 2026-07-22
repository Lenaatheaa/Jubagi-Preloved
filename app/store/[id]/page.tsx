import { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/product/ProductCard';
import { User, MapPin, Calendar, Star, ShieldCheck } from 'lucide-react';

interface StorePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const userId = parseInt(resolvedParams.id);
  if (isNaN(userId)) return { title: 'Toko Tidak Ditemukan' };

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { profile: true }
  });

  return {
    title: `Toko ${user?.profile?.name || user?.email?.split('@')[0]} - JUBAGI`,
    description: `Belanja barang bekas berkualitas dari toko ${user?.profile?.name}.`,
  };
}
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { FollowButton } from '@/components/store/FollowButton';

export default async function StorePage({ params }: StorePageProps) {
  const resolvedParams = await params;
  const userId = parseInt(resolvedParams.id);
  if (isNaN(userId)) notFound();

  const session = await getServerSession(authOptions);
  let currentUserId = null;
  if (session?.user?.email) {
    const cu = await db.user.findUnique({ where: { email: session.user.email }});
    currentUserId = cu?.id;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { 
      profile: true,
      _count: {
        select: { followers: true }
      },
      products: {
        orderBy: { createdAt: 'desc' },
      }
    }
  });

  if (!user) notFound();

  let isFollowing = false;
  if (currentUserId) {
    const followRecord = await db.follow.findUnique({
      where: { followerId_followingId: { followerId: currentUserId, followingId: userId } }
    });
    isFollowing = !!followRecord;
  }

  const displayName = user.profile?.name || user.email.split('@')[0];
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const joinedDate = new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // 1. Fetch Real Rating and Review Count
  const reviews = await db.review.findMany({
    where: { 
      transaction: {
        sellerId: userId 
      }
    },
    select: { rating: true }
  });

  const totalReviews = reviews.length;
  const storeRating = totalReviews > 0 
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1) 
    : '0.0';
  
  const activeProducts = user.products.filter(p => p.status === 'active');
  const soldProducts = user.products.filter(p => p.status === 'sold' || p.status === 'given');

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-[#0B0F19] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        
        {/* Store Header Banner */}
        <div className="bg-card dark:bg-foreground rounded-3xl shadow-sm border border-border p-6 lg:p-10 mb-8 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
            {/* Avatar */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary to-pink-500 rounded-full flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-lg shadow-primary/30 shrink-0 border-4 border-background">
              {user.profile?.avatar ? (
                <img src={user.profile.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                avatarLetter
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-black text-foreground dark:text-foreground">{displayName}</h1>
                <ShieldCheck className="w-6 h-6 text-green-500" />
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground dark:text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{user.profile?.address ? 'Verified Address' : 'Lokasi tidak diketahui'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Bergabung {joinedDate}</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-bold">{storeRating}</span>
                  <span className="text-muted-foreground">({totalReviews} ulasan)</span>
                </div>
              </div>

              <div className="flex items-center justify-center md:justify-start gap-6 py-4 border-t border-border mt-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-foreground">{activeProducts.length}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Produk Aktif</p>
                </div>
                <div className="w-px h-10 bg-border"></div>
                <div className="text-center">
                  <p className="text-2xl font-black text-foreground">{soldProducts.length}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Terjual / Hibah</p>
                </div>
                <div className="w-px h-10 bg-border hidden md:block"></div>
                <div className="hidden md:block">
                  <FollowButton targetUserId={userId} initialFollowing={isFollowing} followerCount={user._count.followers} />
                </div>
              </div>
              
              <div className="md:hidden flex justify-center mt-4">
                 <FollowButton targetUserId={userId} initialFollowing={isFollowing} followerCount={user._count.followers} />
              </div>
            </div>
            
            {/* CTA */}
            <div className="shrink-0 w-full md:w-auto flex flex-col gap-3 mt-4 md:mt-0">
              <button className="w-full bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2">
                Chat Penjual
              </button>
            </div>
          </div>
        </div>

        {/* Store Products */}
        <h2 className="text-2xl font-black text-foreground dark:text-foreground tracking-tight mb-6 flex items-center gap-2">
          Etalase Toko <span className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">{activeProducts.length}</span>
        </h2>
        
        {activeProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
            {activeProducts.map(product => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        ) : (
          <div className="bg-card dark:bg-foreground rounded-3xl border border-border p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">Belum Ada Barang</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Penjual ini sedang tidak memiliki barang aktif untuk dijual atau dihibahkan saat ini.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
