'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, Search, MapPin, Heart, Bell, MessageSquare, User, PlusCircle, LogOut, Gift, Package, Wallet } from 'lucide-react';
import Link from 'next/link';
import { AuthModal } from '@/components/auth/AuthModal';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { CategoryMenu } from './CategoryMenu';
import { NotificationPopup } from './NotificationPopup';
import { PROVINCES } from '@/lib/provinces';

export function Navbar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [authModalConfig, setAuthModalConfig] = useState<{isOpen: boolean, mode: 'login'|'register'}>({
    isOpen: false,
    mode: 'login'
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchLocation, setSearchLocation] = useState(searchParams.get('location') || 'Seluruh Indonesia');

  useEffect(() => {
    if (isMobileMenuOpen || authModalConfig.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen, authModalConfig.isOpen]);

  useEffect(() => {
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Fetch unread notification count
  useEffect(() => {
    if (status !== 'authenticated') return;
    const load = () =>
      fetch('/api/notifications')
        .then(r => r.ok ? r.json() : [])
        .then((d: any[]) => {
          const clearedAtStr = localStorage.getItem('notifClearedAt');
          const clearedAt = clearedAtStr ? parseInt(clearedAtStr) : 0;
          if (Array.isArray(d)) {
            const unread = d.filter(n => !n.read && new Date(n.time).getTime() > clearedAt).length;
            setUnreadCount(unread);
          } else {
            setUnreadCount(0);
          }
        })
        .catch(() => {});
    load();
    const interval = setInterval(load, 60000); // refresh tiap 1 menit
    return () => clearInterval(interval);
  }, [status]);

  const navItems = ['Fashion', 'Elektronik', 'Properti', 'Kendaraan', 'Lainnya'];

  const openAuth = (mode: 'login' | 'register') => {
    setIsMobileMenuOpen(false);
    setAuthModalConfig({ isOpen: true, mode });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() || searchLocation !== 'Seluruh Indonesia') {
      router.push(`/?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(searchLocation)}`);
    } else {
      router.push(`/`);
    }
  };

  const isAdmin = (session?.user as any)?.role === 'admin';

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Admin punya layout sendiri - tidak perlu Navbar biasa
  if (isAdmin) return null;

  // Render a minimal skeleton during loading or before mount to prevent hydration mismatch
  if (!mounted || status === 'loading') {
    return (
      <nav className="fixed top-0 left-0 right-0 bg-background/80 dark:bg-[#0B0F19]/80 backdrop-blur-md z-40 border-b border-border h-20 transition-colors">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 h-full flex items-center justify-between">
           <div className="flex items-center gap-2 group z-50 opacity-50">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                 <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black tracking-tight text-foreground dark:text-foreground">
                 JU<span className="text-primary">BAGI</span>
              </span>
           </div>
        </div>
      </nav>
    );
  }

  // 1. TAMPILAN JIKA SUDAH LOGIN (USER BIASA)
  if (status === 'authenticated' && session) {
    return (
      <nav className="fixed top-0 left-0 right-0 bg-background/95 dark:bg-[#0B0F19]/95 backdrop-blur-md z-40 border-b border-border flex flex-col shadow-sm transition-colors">
        {/* Baris 1: Logo, Kategori & Menu Profil */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 w-full flex items-center justify-between gap-4">
           
           <div className="flex items-center gap-8">
             <Link href="/" className="flex items-center gap-2 group shrink-0">
                <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                   <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-tight text-foreground dark:text-foreground hidden sm:block">
                   JU<span className="text-primary">BAGI</span>
                </span>
             </Link>

             {/* Kategori Menu di sebelah kanan logo */}
             <CategoryMenu />
           </div>

           {/* Kanan: Profil & Ikon */}
           <div className="flex items-center gap-4 lg:gap-6 shrink-0">
               {/* Profil Hello Dropdown */}
               <div className="relative hidden md:block">
                 <button 
                   onClick={() => setShowProfileMenu(!showProfileMenu)} 
                   className="flex items-center gap-2 mr-2 group hover:opacity-80 transition-opacity text-left"
                 >
                    <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-primary border border-pink-100 group-hover:border-primary transition-colors overflow-hidden">
                       {session.user?.image ? (
                         <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                         <User className="w-4 h-4" />
                       )}
                    </div>
                    <div className="flex flex-col">
                       <span className="text-xs text-muted-foreground font-medium -mb-1">Hello,</span>
                       <span className="text-sm font-bold text-foreground dark:text-foreground truncate max-w-[100px]">{session.user?.name}</span>
                    </div>
                 </button>
                 
                 {showProfileMenu && (
                   <div className="absolute top-full right-0 mt-2 w-48 bg-background rounded-2xl shadow-xl border border-border py-2 z-50 flex flex-col">
                     <Link 
                       href="/profile" 
                       onClick={() => setShowProfileMenu(false)}
                       className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted hover:text-primary font-bold transition-colors"
                     >
                       <User className="w-4 h-4" /> Profil Saya
                     </Link>
                     <Link 
                       href="/wishlist" 
                       onClick={() => setShowProfileMenu(false)}
                       className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted hover:text-primary font-bold transition-colors"
                     >
                       <Heart className="w-4 h-4" /> Wishlist
                     </Link>
                     <Link 
                       href="/transactions" 
                       onClick={() => setShowProfileMenu(false)}
                       className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted hover:text-primary font-bold transition-colors"
                     >
                       <Package className="w-4 h-4" /> Pesanan Saya
                     </Link>
                     <Link 
                       href="/profile/wallet" 
                       onClick={() => setShowProfileMenu(false)}
                       className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted hover:text-primary font-bold transition-colors"
                     >
                       <Wallet className="w-4 h-4" /> Dompet Saya
                     </Link>
                     <Link 
                       href="/hibah" 
                       onClick={() => setShowProfileMenu(false)}
                       className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-muted hover:text-primary font-bold transition-colors"
                     >
                       <Gift className="w-4 h-4" /> Manajemen Hibah
                     </Link>
                     <div className="h-px bg-border my-1 w-full" />
                     <button 
                       onClick={() => signOut({ callbackUrl: '/' })} 
                       className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 font-bold transition-colors"
                     >
                       <LogOut className="w-4 h-4" /> Keluar
                     </button>
                   </div>
                 )}
                 {showProfileMenu && (
                   <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                 )}
               </div>

              {/* Ikon Aksi */}
              <div className="flex items-center gap-3">

                 <div className="relative">
                    <button
                      onClick={() => {
                        setShowNotifications(prev => !prev);
                        setUnreadCount(0);
                        localStorage.setItem('notifClearedAt', Date.now().toString());
                      }}
                      className="p-2 text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-card hover:text-primary rounded-full transition-colors relative"
                    >
                       <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-destructive text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 border-2 border-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                    </button>
                    <NotificationPopup isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
                 </div>
                 <Link href="/chat" className="p-2 text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-card hover:text-primary rounded-full transition-colors">
                    <MessageSquare className="w-5 h-5" />
                 </Link>
              </div>

              <div className="w-px h-6 bg-gray-200 hidden md:block"></div>

              {/* Tombol Jual & Keluar */}
              <div className="flex items-center gap-3">
                 <Link href="/jual" className="bg-destructive hover:bg-destructive/90 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-destructive/20 flex items-center gap-1.5 hover:-translate-y-0.5">
                    <PlusCircle className="w-4 h-4" /> <span className="hidden sm:inline">Jual</span>
                 </Link>
              </div>
           </div>
        </div>

        {/* Baris 2: Kolom Pencarian & Lokasi */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-3 pt-1 w-full">
           <form onSubmit={handleSearch} className="flex items-center bg-muted dark:bg-card rounded-2xl border border-border focus-within:border-primary focus-within:bg-background dark:focus-within:bg-background focus-within:shadow-md focus-within:shadow-primary/10 transition-all p-1.5">
              
              {/* Pemilih Lokasi */}
              <div className="flex items-center pl-3 pr-2 border-r border-border shrink-0 cursor-pointer group">
                 <MapPin className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mr-1.5" />
                 <select 
                    value={searchLocation}
                    onChange={e => setSearchLocation(e.target.value)}
                    className="bg-transparent text-sm font-medium text-muted-foreground dark:text-muted-foreground outline-none cursor-pointer appearance-none"
                 >
                    {PROVINCES.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                 </select>
              </div>

              {/* Input Search */}
              <div className="flex-1 flex items-center px-3">
                 <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari barang antik, pakaian, atau hibah hari ini..." 
                    className="w-full bg-transparent border-none outline-none text-sm text-foreground dark:text-foreground placeholder:text-muted-foreground"
                 />
              </div>

              {/* Tombol Cari */}
              <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl shrink-0 transition-colors text-sm font-bold">
                 Cari
              </button>
           </form>
        </div>
      </nav>
    );
  }

  // 2. TAMPILAN JIKA BELUM LOGIN (GUEST)
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-background/80 dark:bg-[#0B0F19]/80 backdrop-blur-md z-40 border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 h-20 flex items-center justify-between">
           <div className="flex items-center gap-8 z-50">
             <Link href="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                   <ShoppingBag className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black tracking-tight text-foreground dark:text-foreground">
                   JU<span className="text-primary">BAGI</span>
                </span>
             </Link>
             
             {/* Kategori Mega Menu (Desktop) */}
             <CategoryMenu />
           </div>
           
           {/* Desktop Navigation */}
           <>
             <div className="hidden lg:flex items-center gap-8">
                {/* Menu categories is managed by CategoryMenu on desktop */}
             </div>
             
             {/* Desktop Auth Buttons */}
             <div className="hidden lg:flex items-center gap-6">
                  <button onClick={() => openAuth('login')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                     Masuk
                  </button>
                  <button onClick={() => openAuth('register')} className="bg-primary hover:bg-primary/90 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-all hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5">
                     Daftar
                  </button>
               </div>

               {/* Mobile Hamburger Button */}
               <button 
                 className="lg:hidden z-50 p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               >
                 {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
               </button>
             </>
           
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-background z-30 pt-24 px-6 flex flex-col lg:hidden animate-in slide-in-from-top-4 duration-200">
           <div className="flex flex-col gap-6 text-center text-lg font-medium">
             {/* Kategori dapat diakses di menu dropdown, biarkan kosong atau tambahkan menu statis dasar */}
             <Link href="/" className="text-foreground hover:text-primary py-2 border-b border-gray-50 dark:border-white/10 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Beranda</Link>
             <Link href="/products" className="text-foreground hover:text-primary py-2 border-b border-gray-50 dark:border-white/10 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Katalog Produk</Link>
           </div>

           <div className="mt-auto mb-10 flex flex-col gap-4">
             <button 
               onClick={() => openAuth('login')}
               className="w-full bg-background border-2 border-border text-foreground font-bold py-3.5 rounded-xl hover:bg-muted transition-colors"
             >
               Masuk
             </button>
             <button 
               onClick={() => openAuth('register')}
               className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-transform"
             >
               Daftar Akun Gratis
             </button>
          </div>
        </div>
      )}

      {/* Auth Modal Portal */}
      <AuthModal 
        isOpen={authModalConfig.isOpen} 
        mode={authModalConfig.mode}
        onClose={() => setAuthModalConfig({ ...authModalConfig, isOpen: false })} 
      />
    </>
  );
}
