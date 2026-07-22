import { getServerSession } from 'next-auth/next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { HeroSection } from '@/components/landing/HeroSection';
import { CategorySection } from '@/components/landing/CategorySection';
import { ProductsSection } from '@/components/product/ProductsSection';
import { WhyJubagiSection } from '@/components/landing/WhyJubagiSection';
import { CTASection } from '@/components/landing/CTASection';
import { DashboardView } from '@/components/dashboard/DashboardView';

export default async function Home() {
  const session = await getServerSession(authOptions);

  // Redirect admin ke dashboard admin
  if (session && (session.user as any)?.role === 'admin') {
    redirect('/admin');
  }

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {session ? (
        <Suspense fallback={<div>Loading dashboard...</div>}>
          <DashboardView />
        </Suspense>
      ) : (
        <>
          <Suspense fallback={<div>Loading...</div>}>
            <HeroSection />
          </Suspense>
          <CategorySection />
          <Suspense fallback={<div>Loading products...</div>}>
            <ProductsSection />
          </Suspense>
          <WhyJubagiSection />
          <CTASection />
        </>
      )}
    </div>
  );
}

