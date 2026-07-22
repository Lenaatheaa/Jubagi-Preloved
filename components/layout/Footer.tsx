'use client';

import { ShoppingBag, Globe, MessageCircle, Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();
  
  // Sembunyikan Footer di halaman admin
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="bg-[#0B0F19] text-gray-400 font-sans border-t border-border">

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-20 pb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 border-b border-gray-800/50">
        
        {/* Brand Section (Takes up 2 columns on lg) */}
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-6 group">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <span className="text-3xl font-black tracking-tighter text-white">
              JU<span className="text-primary">BAGI</span>
            </span>
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm mb-8">
            Platform marketplace dan berbagi barang bekas terdepan di Indonesia. Menggabungkan teknologi e-commerce dengan semangat gotong royong nusantara.
          </p>
          
          <div className="space-y-4 text-sm">
            <a href="https://www.google.com/maps/search/?api=1&query=Universitas+Islam+Indonesia+Kampus+Terpadu+Jalan+Kaliurang" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:text-white transition-colors group cursor-pointer">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <span>Kampus Terpadu UII<br />Jl. Kaliurang km. 14,5 Sleman, Yogyakarta</span>
            </a>
            <a href="https://wa.me/6282314972331" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition-colors group cursor-pointer">
              <Phone className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
              <span>+62 823-1497-2331 (WhatsApp)</span>
            </a>
            <a href="mailto:jubagipreloved@gmail.com" className="flex items-center gap-3 hover:text-white transition-colors group cursor-pointer">
              <Mail className="w-5 h-5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
              <span>jubagipreloved@gmail.com</span>
            </a>
          </div>
        </div>
        
        {/* JUBAGI Section */}
        <div>
          <h4 className="text-white font-black mb-6 tracking-wider text-sm uppercase">Jelajahi JUBAGI</h4>
          <ul className="space-y-4 text-sm font-medium">
            <li><Link href="/products" className="hover:text-primary transition-colors inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>Katalog Produk</Link></li>
            <li><Link href="/products?category=fashion" className="hover:text-primary transition-colors inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>Kategori Fashion</Link></li>
            <li><Link href="/products?category=elektronik" className="hover:text-primary transition-colors inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>Kategori Elektronik</Link></li>
            <li><Link href="/hibah" className="hover:text-primary transition-colors inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>Program Hibah</Link></li>
            <li><Link href="/products?type=hot" className="hover:text-primary transition-colors inline-flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500/50"></span>Sedang Tren (Hot)</Link></li>
          </ul>
        </div>
        
        {/* Info & Bantuan Section */}
        <div>
          <h4 className="text-white font-black mb-6 tracking-wider text-sm uppercase">Layanan Pelanggan</h4>
          <ul className="space-y-4 text-sm font-medium">
            <li><Link href="/help" className="hover:text-primary transition-colors">Pusat Bantuan (FAQ)</Link></li>
            <li><Link href="/help/sell" className="hover:text-primary transition-colors">Panduan Berjualan</Link></li>
            <li><Link href="/help/buy" className="hover:text-primary transition-colors">Panduan Pembelian</Link></li>
            <li><Link href="/help/hibah" className="hover:text-primary transition-colors">Cara Menerima Hibah</Link></li>
            <li><Link href="/profile/wallet" className="hover:text-primary transition-colors">Informasi Dompet & Saldo</Link></li>
          </ul>
        </div>
        
        {/* Pembayaran & Kurir (Takes up 2 columns) */}
        <div className="lg:col-span-2">
          <h4 className="text-white font-black mb-6 tracking-wider text-sm uppercase">Metode Pembayaran & Pengiriman</h4>
          <div className="grid grid-cols-4 gap-3 mb-8">
            <div className="bg-gray-800/50 border border-gray-700/50 h-10 rounded flex items-center justify-center p-2"><span className="text-[10px] font-bold text-white">BCA VA</span></div>
            <div className="bg-gray-800/50 border border-gray-700/50 h-10 rounded flex items-center justify-center p-2"><span className="text-[10px] font-bold text-white">MANDIRI</span></div>
            <div className="bg-gray-800/50 border border-gray-700/50 h-10 rounded flex items-center justify-center p-2"><span className="text-[10px] font-bold text-white">BNI</span></div>
            <div className="bg-gray-800/50 border border-gray-700/50 h-10 rounded flex items-center justify-center p-2"><span className="text-[10px] font-bold text-white text-center">QRIS</span></div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-800/50 border border-gray-700/50 h-10 rounded flex items-center justify-center p-2"><span className="text-[10px] font-bold text-white">JNE</span></div>
            <div className="bg-gray-800/50 border border-gray-700/50 h-10 rounded flex items-center justify-center p-2"><span className="text-[10px] font-bold text-white">J&T</span></div>
            <div className="bg-gray-800/50 border border-gray-700/50 h-10 rounded flex items-center justify-center p-2"><span className="text-[10px] font-bold text-white text-center">Sicepat</span></div>
            <div className="bg-gray-800/50 border border-gray-700/50 h-10 rounded flex items-center justify-center p-2"><span className="text-[10px] font-bold text-white">GoSend</span></div>
          </div>
        </div>

      </div>
      
      {/* Bottom Legal & Social */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 text-xs font-medium">
          <span className="text-gray-500">&copy; {new Date().getFullYear()} JUBAGI Indonesia. Hak Cipta Dilindungi.</span>
          <div className="hidden md:block w-1 h-1 bg-gray-700 rounded-full"></div>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
          </div>
        </div>

        {/* Social Media */}
        <div className="flex items-center gap-4">
          <a href="#" className="w-10 h-10 rounded-full bg-gray-800/80 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-all duration-300">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-gray-800/80 flex items-center justify-center hover:bg-[#E4405F] hover:text-white transition-all duration-300">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-gray-800/80 flex items-center justify-center hover:bg-[#1DA1F2] hover:text-white transition-all duration-300">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
          </a>
          <a href="#" className="w-10 h-10 rounded-full bg-gray-800/80 flex items-center justify-center hover:bg-[#FF0000] hover:text-white transition-all duration-300">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
