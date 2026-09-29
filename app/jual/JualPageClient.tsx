'use client';

import { useState } from 'react';
import { SellFormView } from '@/components/product/SellFormView';
import { SellerTermsModal } from '@/components/profile/SellerTermsModal';

export function JualPageClient({ hasAcceptedTerms }: { hasAcceptedTerms: boolean }) {
  const [isAccepted, setIsAccepted] = useState(hasAcceptedTerms);

  if (!isAccepted) {
    return <SellerTermsModal onSuccess={() => setIsAccepted(true)} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-28 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground">
          Pasang <span className="text-primary">Iklan</span>
        </h1>
        <p className="text-muted-foreground mt-1">Upload foto, tentukan detail, dan mulai berjualan!</p>
      </div>
      <SellFormView />
    </div>
  );
}
