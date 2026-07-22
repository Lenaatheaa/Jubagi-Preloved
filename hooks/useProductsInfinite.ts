import { useState, useEffect, useCallback, useRef } from 'react';
import type { Product } from '@/components/product/ProductCard';

interface UseProductsInfiniteProps {
  q?: string;
  location?: string;
  category?: string;
  type?: string;
  condition?: string;
  limit?: number;
}

export function useProductsInfinite(filters: UseProductsInfiniteProps = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const { q = '', location = '', category = '', type = '', condition = '', limit = 12 } = filters;

  // Lacak string filter untuk mereset data saat filter berubah
  const filterString = `${q}|${location}|${category}|${type}|${condition}|${limit}`;
  const prevFilterString = useRef(filterString);

  const fetchProducts = useCallback(async (pageNum: number, isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const queryParams = new URLSearchParams();
      if (q) queryParams.append('q', q);
      if (location && location !== 'Seluruh Indonesia') queryParams.append('location', location);
      if (category) queryParams.append('category', category);
      if (type) queryParams.append('type', type);
      if (condition) queryParams.append('condition', condition);
      
      queryParams.append('page', pageNum.toString());
      queryParams.append('limit', limit.toString());

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const newProducts = data.products || [];
        const pagination = data.pagination || { hasMore: false };

        setProducts(prev => isLoadMore ? [...prev, ...newProducts] : newProducts);
        setHasMore(pagination.hasMore);
      } else {
        if (!isLoadMore) setProducts([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Gagal mengambil data produk terpaginasi:', error);
      if (!isLoadMore) setProducts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [q, location, category, type, condition, limit]);

  // Satu useEffect tunggal: menangani load awal DAN perubahan filter
  // Menghindari double-fetch yang terjadi saat mount pertama kali
  useEffect(() => {
    const filterChanged = prevFilterString.current !== filterString;
    if (filterChanged) {
      prevFilterString.current = filterString;
    }
    setPage(1);
    fetchProducts(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterString]); // Hanya berulang saat filter berubah

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, true);
    }
  }, [loading, loadingMore, hasMore, page, fetchProducts]);

  const reset = useCallback(() => {
    setPage(1);
    fetchProducts(1, false);
  }, [fetchProducts]);

  return { products, loading, loadingMore, hasMore, loadMore, reset };
}
