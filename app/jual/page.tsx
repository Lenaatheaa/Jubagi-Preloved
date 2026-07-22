import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SellFormView } from '@/components/product/SellFormView';

export const metadata = {
  title: 'Jual Barang - JUBAGI',
  description: 'Pasang iklan dan jual barang kamu dengan mudah di JUBAGI.',
};

export default async function JualPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/');

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 dark:from-background dark:via-background dark:to-primary/10">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-28 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground">
            Pasang <span className="text-primary">Iklan</span>
          </h1>
          <p className="text-muted-foreground mt-1">Upload foto, tentukan detail, dan mulai berjualan!</p>
        </div>
        <SellFormView />
      </div>
    </main>
  );
}
