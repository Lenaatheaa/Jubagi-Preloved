import Link from 'next/link';
import { BannerAd } from '@/lib/banners';

export function InlineBanner({ banner }: { banner: BannerAd }) {
  return (
    <div className="col-span-full w-full py-2 my-2">
      <Link href={banner.targetUrl} className="block w-full group relative rounded-2xl overflow-hidden bg-muted shadow-sm hover:shadow-md transition-shadow">
        <div className="aspect-[4/1] sm:aspect-[6/1] md:aspect-[8/1] w-full overflow-hidden">
          <img 
            src={banner.imageUrl} 
            alt={banner.altText} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          {/* Overlay gradien agar banner tidak terlalu mencolok dan menyatu dengan UI */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex flex-col justify-center px-6 md:px-12">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-white/80 bg-black/50 w-fit px-2 py-0.5 rounded-full mb-1 border border-white/20">
              Iklan Sponsor
            </span>
            <h3 className="text-white font-black text-lg md:text-2xl drop-shadow-md">
              {banner.altText}
            </h3>
          </div>
        </div>
      </Link>
    </div>
  );
}
