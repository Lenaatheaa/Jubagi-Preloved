'use client';

import { useProduct } from '@/hooks/useProduct';
import { ProductCard } from './ProductCard';
import { Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function ProductsSection() {
   const { products } = useProduct();
   const router = useRouter();
   const tabs = ['Semua', 'Dijual', 'Hibah', 'Fashion', 'Elektronik', 'Kendaraan'];

   const handleTabClick = (tab: string) => {
      if (tab === 'Semua') router.push('/products');
      else if (tab === 'Dijual') router.push('/products?type=jual');
      else if (tab === 'Hibah') router.push('/products?type=hibah');
      else if (tab === 'Fashion') router.push('/products?category=fashion');
      else if (tab === 'Elektronik') router.push('/products?category=elektronik');
      else if (tab === 'Kendaraan') router.push('/products?category=kendaraan');
   };

   return (
      <section className="w-full py-20 bg-muted/50 border-t border-border">
         <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
               <div>
                  <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4 inline-flex items-center gap-1.5">
                     <Sparkles className="w-4 h-4" /> Produk Terbaru
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                     Produk <span className="text-primary">Pilihan</span> Hari Ini
                  </h2>
               </div>
               <Link href="/products" className="text-primary font-bold hover:underline flex items-center gap-2 transition-colors">
                  Lihat semua <ArrowRight className="w-4 h-4" />
               </Link>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-6 mb-4 scrollbar-hide w-full">
               {tabs.map((tab, idx) => (
                  <button
                     key={idx}
                     onClick={() => handleTabClick(tab)}
                     className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:scale-105 active:scale-95 ${idx === 0
                        ? 'bg-primary text-white shadow-md shadow-primary/30'
                        : 'bg-card text-muted-foreground hover:bg-primary/10 border border-border'
                        }`}
                  >
                     {tab}
                  </button>
               ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
               {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
               ))}
            </div>
         </div>
      </section>
   );
}
