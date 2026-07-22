import { Heart, Gift, MessageCircle, CheckCircle } from 'lucide-react';
import type { Product } from '@/components/product/ProductCard';

export const DUMMY_PRODUCTS: Product[] = [
  {
    id: '1',
    type: 'jual',
    condition: 'Bekas - Bagus',
    category: 'FASHION',
    title: 'Kemeja Flanel Vintage Kotak-kotak Size L',
    price: 85000,
    location: 'Jakarta Selatan',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e2c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: '2',
    type: 'jual',
    condition: 'Bekas - Sangat Bagus',
    category: 'ELEKTRONIK',
    title: 'iPhone 12 Pro 128GB - Mulus Bergaransi',
    price: 7500000,
    location: 'Bandung',
    image: 'https://images.unsplash.com/photo-1611791485440-24e8fc196eb8?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: '3',
    type: 'jual',
    condition: 'Bekas - Bagus',
    category: 'KENDARAAN',
    title: 'Sepeda Gunung Polygon Xtrada 6',
    price: 3200000,
    location: 'Surabaya',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: '4',
    type: 'hibah',
    condition: 'Bekas - Bagus',
    category: 'FURNITUR',
    title: 'Sofa 3 Dudukan Minimalis Abu-abu',
    price: 'Gratis',
    location: 'Yogyakarta',
    image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80'
  }
];

export type FilterType = 'inbox' | 'selling' | 'buying' | 'archived' | 'unread';

export const DUMMY_CHATS = [
  {
    id: 1, filter: ['inbox', 'buying'] as FilterType[],
    name: 'Budi Santoso', avatar: null,
    product: 'iPhone 12 Pro 128GB', type: 'jual',
    lastMessage: 'Apakah masih tersedia kak?', time: '10:30', unread: 2,
    messages: [
      { id: 1, from: 'them', text: 'Halo kak, barangnya masih ada?', time: '10:20' },
      { id: 2, from: 'me', text: 'Masih ada kak!', time: '10:25' },
      { id: 3, from: 'them', text: 'Apakah masih tersedia kak?', time: '10:30' },
    ]
  },
  {
    id: 2, filter: ['inbox', 'selling'] as FilterType[],
    name: 'Siti Rahayu', avatar: null,
    product: 'Sofa Minimalis Abu-abu', type: 'hibah',
    lastMessage: 'Permintaan hibah saya sudah dikirim ', time: '09:15', unread: 0,
    messages: [
      { id: 1, from: 'them', text: 'Halo, saya ingin mengajukan hibah untuk sofa ini', time: '09:00' },
      { id: 2, from: 'them', text: 'Permintaan hibah saya sudah dikirim ', time: '09:15' },
    ]
  },
  {
    id: 3, filter: ['inbox', 'buying', 'archived'] as FilterType[],
    name: 'Andi Pratama', avatar: null,
    product: 'Kemeja Flanel Vintage', type: 'jual',
    lastMessage: 'Deal! Saya transfer sekarang ya kak', time: 'Kemarin', unread: 0,
    messages: [
      { id: 1, from: 'me', text: 'Halo kak, bisa kurang?', time: 'Kemarin' },
      { id: 2, from: 'them', text: 'Deal! Saya transfer sekarang ya kak', time: 'Kemarin' },
    ]
  },
];

export interface AppNotification {
  id: number;
  icon: React.ReactNode;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'like' | 'chat' | 'hibah' | 'sold';
}

export const DUMMY_NOTIFS: AppNotification[] = [
  { id: 1, type: 'like', icon: <Heart className="w-4 h-4 text-primary" />, title: 'Barang kamu disukai', body: 'Budi menyukai iPhone 12 Pro milikmu', time: '5 menit lalu', read: false },
  { id: 2, type: 'hibah', icon: <Gift className="w-4 h-4 text-green-500" />, title: 'Pengajuan Hibah Baru', body: 'Siti mengajukan hibah untuk Sofa Minimalis', time: '1 jam lalu', read: false },
  { id: 3, type: 'chat', icon: <MessageCircle className="w-4 h-4 text-blue-500" />, title: 'Pesan baru', body: 'Andi: "Apakah bisa kurang harganya kak?"', time: '2 jam lalu', read: true },
  { id: 4, type: 'sold', icon: <CheckCircle className="w-4 h-4 text-purple-500" />, title: 'Barang terjual!', body: 'Kemeja Flanel Vintage kamu telah terjual', time: 'Kemarin', read: true },
];
