export interface BannerAd {
  id: string;
  imageUrl: string;
  targetUrl: string;
  altText: string;
  positionIndex: number; // Tampil setelah produk ke-berapa (misal: 5 berarti setelah 6 produk pertama / 2 baris)
}

export const INLINE_BANNERS: BannerAd[] = [
  {
    id: 'banner-1',
    imageUrl: '/images/banners/promo_fashion.png',
    targetUrl: '/products?category=fashion',
    altText: 'Fashion Sale 50% Off',
    positionIndex: 4, // Muncul setelah 5 produk (selesai 1 baris di grid-5)
  },
  {
    id: 'banner-2',
    imageUrl: '/images/banners/promo_elektronik.png',
    targetUrl: '/products?category=elektronik',
    altText: 'Gadget Murah Berkualitas',
    positionIndex: 9, // Muncul setelah 10 produk (selesai 2 baris di grid-5)
  },
  {
    id: 'banner-3',
    imageUrl: '/images/banners/promo_hibah.png',
    targetUrl: '/hibah',
    altText: 'Mari Berbagi Bersama JUBAGI',
    positionIndex: 14, // Muncul setelah 15 produk (selesai 3 baris di grid-5)
  }
];
