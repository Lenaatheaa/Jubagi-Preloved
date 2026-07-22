'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const ADS = [
  {
    id: 1,
    title: 'JUARA,\nJuni Hemat Gembira!',
    badge: 'FREE 2 Produk Tanpa Minimal Beli!',
    subtitle: 'Naikin exposure dan buka peluang baru bareng CarouBiz',
    bg: 'bg-[#D32323]', // Red background like Carousell
    gradient: 'from-[#D32323]',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070',
    linkText: 'Klik dan pelajari lebih lanjut'
  },
  {
    id: 2,
    title: 'Tukar Tambah\nLebih Cuan!',
    badge: 'Mampir ke store, Langsung deal!',
    subtitle: 'Jual beli Gadget, Console, Smartwatch, dan Tablet makin gampang.',
    bg: 'bg-[#009D69]', // Green background
    gradient: 'from-[#009D69]',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=2080',
    linkText: 'Mulai Tukar Tambah'
  }
];

export function AdCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ADS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % ADS.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + ADS.length) % ADS.length);
  };

  return (
    <div className="relative w-full h-[300px] md:h-[400px] rounded-none md:rounded-xl overflow-hidden group">
      {/* Slides */}
      <div 
        className="flex transition-transform duration-500 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {ADS.map((ad) => (
          <div key={ad.id} className="min-w-full h-full relative flex">
             {/* Left Text Content */}
             <div className={`w-1/2 h-full ${ad.bg} relative z-20 flex flex-col justify-center px-6 md:px-16 text-white`}>
                <h3 className="text-3xl md:text-5xl font-black mb-4 whitespace-pre-line leading-tight">{ad.title}</h3>
                
                {ad.badge && (
                  <div className="bg-blue-600 border border-white text-white text-xs md:text-sm font-bold px-4 py-1.5 rounded-full w-fit mb-3 shadow-md">
                    {ad.badge}
                  </div>
                )}
                
                <p className="text-sm md:text-lg font-medium opacity-90 max-w-md leading-snug">{ad.subtitle}</p>
                
                <div className="absolute bottom-4 md:bottom-8 left-6 md:left-16 text-xs md:text-sm font-medium opacity-80 cursor-pointer hover:underline">
                  {ad.linkText}
                </div>
             </div>

             {/* Right Image Content */}
             <div className="w-1/2 h-full relative">
               <img 
                 src={ad.image} 
                 alt="Banner Image" 
                 className="absolute inset-0 w-full h-full object-cover"
               />
               <div className={`absolute inset-0 bg-gradient-to-r ${ad.gradient} to-transparent w-32`}></div>
             </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-30"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white z-30 shadow-lg group-hover:scale-110 transition-all"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
        {ADS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
