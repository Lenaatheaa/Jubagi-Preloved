import { useState, useEffect } from 'react';
import type { Product } from '@/components/product/ProductCard';
import { useSearchParams } from 'next/navigation';

export function useProduct() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = searchParams.get('q') || '';
        const location = searchParams.get('location') || '';
        const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  return { products, loading };
}
