import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { WishlistView } from '@/components/product/WishlistView';

export const metadata = { title: 'Wishlist - JUBAGI' };

export default async function WishlistPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/');

  return (
    <main className="min-h-screen bg-muted">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-28 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground">
             <span className="text-primary">Wishlist</span>
          </h1>
          <p className="text-muted-foreground mt-1">Barang-barang yang kamu sukai</p>
        </div>
        <WishlistView />
      </div>
    </main>
  );
}
