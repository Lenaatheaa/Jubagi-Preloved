import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db as prisma } from '@/lib/db';
import { JualPageClient } from './JualPageClient';

export const metadata = {
  title: 'Jual Barang - JUBAGI',
  description: 'Pasang iklan dan jual barang kamu dengan mudah di JUBAGI.',
};

export default async function JualPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isSellerAcceptedTerms: true },
  });

  if (!user) redirect('/');

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50/30 dark:from-background dark:via-background dark:to-primary/10">
      <JualPageClient hasAcceptedTerms={user.isSellerAcceptedTerms || false} />
    </main>
  );
}
