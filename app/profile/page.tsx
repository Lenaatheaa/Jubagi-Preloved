import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db as prisma } from '@/lib/db';
import Link from 'next/link';
import { Edit, Package, Star, Calendar, MapPin } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { ProfileTabsView } from '@/components/profile/ProfileTabsView';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      profile: true,
      products: {
        where: { 
          status: { not: 'sold' },
          deletedAt: null
        },
        include: {
          category: true,
          images: true,
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    redirect('/');
  }

  // Fetch reviews associated with this user's transactions (as seller)
  const reviews = await prisma.review.findMany({
    where: {
      transaction: {
        sellerId: user.id
      }
    }
  });
  
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews).toFixed(1) 
    : '0';

  // Format the joined date with calendar logic
  const joinedDate = new Date(user.createdAt);
  const formattedJoinedDate = joinedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  
  const now = new Date();
  let yearsDiff = now.getFullYear() - joinedDate.getFullYear();
  let monthsDiff = now.getMonth() - joinedDate.getMonth();
  let daysDiff = now.getDate() - joinedDate.getDate();

  if (daysDiff < 0) {
    monthsDiff--;
    // Get days in previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    daysDiff += prevMonth.getDate();
  }
  
  if (monthsDiff < 0) {
    yearsDiff--;
    monthsDiff += 12;
  }

  let durationText = '0 hari';
  if (yearsDiff > 0) {
    durationText = `${yearsDiff} tahun`;
    if (monthsDiff > 0) durationText += ` ${monthsDiff} bulan`;
  } else if (monthsDiff > 0) {
    durationText = `${monthsDiff} bulan`;
    if (daysDiff > 0) durationText += ` ${daysDiff} hari`;
  } else if (daysDiff > 0) {
    durationText = `${daysDiff} hari`;
  }

  // Transform products to match the ProductCard interface
  const formattedProducts = user.products.map(p => ({
    id: p.id.toString(),
    type: p.type as 'jual' | 'hibah',
    condition: p.condition || 'Baru',
    category: p.category?.name || 'Lainnya',
    title: p.title || 'Untitled',
    price: p.price ? Number(p.price) : 'Gratis',
    location: p.location || 'Indonesia',
    image: p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  }));

  const displayName = user.profile?.name || session.user.name || user.email.split('@')[0].toUpperCase();
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-muted pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 lg:px-6">
        
        {/* Header Profile Section */}
        <div className="bg-card rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden mb-8 text-foreground border border-border">
          {/* Decorative Blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full -z-0 blur-3xl opacity-50" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-primary to-pink-500 rounded-full flex items-center justify-center text-4xl md:text-5xl font-black text-white shadow-lg shadow-primary/30 shrink-0 border-4 border-background">
              {user.profile?.avatar ? (
                <img src={user.profile.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                avatarLetter
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">{displayName}</h1>
                <span className="bg-muted text-muted-foreground text-xs font-bold px-3 py-1 rounded-full w-fit mx-auto md:mx-0 border border-border">
                  Verified Email
                </span>
              </div>
              
              <p className="text-muted-foreground text-sm mb-6 flex items-center justify-center md:justify-start gap-1">
                {user.email}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 md:gap-12">
                <div className="text-center md:text-left">
                  <p className="text-muted-foreground text-xs font-medium uppercase mb-1">Total Review</p>
                  <div className="flex items-center justify-center md:justify-start">
                    {totalReviews > 0 ? (
                      <div className="flex items-center">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < Math.round(Number(avgRating)) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} 
                            />
                          ))}
                        </div>
                        <span className="ml-2 font-bold">{avgRating}</span>
                        <span className="text-muted-foreground font-normal text-xs ml-1.5">({totalReviews} orang)</span>
                      </div>
                    ) : (
                      <p className="font-bold flex items-center gap-1.5 justify-center md:justify-start">
                        N/A <span className="text-muted-foreground font-normal text-xs">(Belum ada ulasan)</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-muted-foreground text-xs font-medium uppercase mb-1">Bergabung Sejak</p>
                  <p className="font-bold flex items-center gap-1.5 justify-center md:justify-start">
                    {durationText} <span className="text-muted-foreground font-normal text-xs">({formattedJoinedDate})</span>
                  </p>
                </div>
                {/* Saldo Block */}
                <div className="text-center md:text-left">
                  <p className="text-muted-foreground text-xs font-medium uppercase mb-1">Saldo Penjualan</p>
                  <div className="flex items-center gap-2 justify-center md:justify-start">
                    <p className="font-bold text-green-600 text-lg">Rp {user.balance.toLocaleString('id-ID')}</p>
                    <Link href="/dashboard/withdrawals" className="text-[10px] font-bold bg-muted hover:bg-gray-200 text-foreground px-2 py-1 rounded-full border border-border transition-colors">
                      Tarik Saldo
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className="shrink-0 mt-4 md:mt-0">
              <Link 
                href="/settings"
                className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-border hover:border-primary hover:bg-muted transition-colors font-bold text-sm"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Content Tabs extracted to a Client Component */}
        <ProfileTabsView userId={user.id} formattedProducts={formattedProducts} />

      </div>
    </div>
  );
}
