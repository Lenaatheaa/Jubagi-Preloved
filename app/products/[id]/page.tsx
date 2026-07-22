'use client';

import { useState, useEffect } from 'react';
import { Heart, MapPin, MessageCircle, ChevronLeft, ChevronRight, Package, Truck, Home, Star, Clock, Share2, Flag, Shield, Loader2, CheckCircle2, Edit, Trash2, Images, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { HibahRequestModal } from '@/components/hibah/HibahRequestModal';
import { HibahRequestList } from '@/components/hibah/HibahRequestList';
import { BoostModal } from '@/components/product/BoostModal';

const CONDITION_LABELS: Record<string, string> = {
  brand_new: 'Baru',
  like_new: 'Seperti Baru',
  lightly_used: 'Jarang Dipakai',
  well_used: 'Sering Dipakai',
  heavily_used: 'Sangat Sering Dipakai',
};

const DEAL_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  pickup: { label: 'Ambil di Rumah', icon: <Home className="w-4 h-4" /> },
  delivery: { label: 'Pengantaran', icon: <Truck className="w-4 h-4" /> },
  both: { label: 'Keduanya', icon: <Package className="w-4 h-4" /> },
};

interface ProductDetail {
  id: string;
  title: string;
  description: string;
  price: number | null;
  type: 'jual' | 'hibah';
  condition: string;
  category: string;
  location: string;
  dealMethod: string;
  size: string;
  brand: string;
  status: string;
  images: string[];
  sellerId: number;
  sellerName: string;
  sellerEmail: string;
  sellerAvatar: string | null;
  sellerRating?: string;
  sellerReviewCount?: number;
  createdAt: string;
  isLiked?: boolean;
  likeCount?: number;
}

declare global {
  interface Window { snap: any; }
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [offerPrice, setOfferPrice] = useState('');
  const [showHibahModal, setShowHibahModal] = useState(false);
  const [showHibahRequests, setShowHibahRequests] = useState(false);
  const [hibahSuccess, setHibahSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [buying, setBuying] = useState(false);
  const [offering, setOffering] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [boostSuccess, setBoostSuccess] = useState(false);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  // Load Midtrans Snap script
  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey || '');
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  // Fetch product from API
  useEffect(() => {
    if (!id) return;
    setLoadingProduct(true);
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.message) {
          setProduct(data);
          setLiked(data.isLiked || false);
          setLikeCount(data.likeCount || 0);
        }
        setLoadingProduct(false);
      })
      .catch(() => setLoadingProduct(false));
  }, [id]);

  if (loadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3"></p>
          <p className="font-bold text-muted-foreground">Produk tidak ditemukan</p>
          <Link href="/" className="text-primary text-sm font-bold mt-2 block hover:underline">Kembali ke beranda</Link>
        </div>
      </div>
    );
  }

  const isHibah = product.type === 'hibah';
  const isOwner = session?.user?.email === product.sellerEmail;
  const photos = product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1503602642458-232111445657?w=800'];

  const prevPhoto = () => setPhotoIndex(i => (i - 1 + photos.length) % photos.length);
  const nextPhoto = () => setPhotoIndex(i => (i + 1) % photos.length);

  const toggleLike = async () => {
    if (!session) { setErrorMsg('Kamu harus login untuk menyimpan barang.'); return; }
    setLiked(prev => !prev);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    await fetch('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id }),
    });
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    setDeleting(true);
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/');
    else setDeleting(false);
  };

  const handleChat = async () => {
    if (!session) { setErrorMsg('Kamu harus login untuk menghubungi penjual.'); return; }
    // Create or find the room, then redirect
    const res = await fetch(`/api/chat/rooms?productId=${id}&sellerId=${product.sellerId}`);
    const data = await res.json();
    if (data.room?.id) {
      router.push(`/chat?roomId=${data.room.id}&productId=${id}&productTitle=${encodeURIComponent(product.title)}`);
    } else {
      setErrorMsg('Gagal membuka chat. Coba lagi.');
    }
  };

  const handleOffer = async () => {
    if (!session) { setErrorMsg('Kamu harus login untuk menawar.'); return; }
    if (!offerPrice || isNaN(Number(offerPrice))) { setErrorMsg('Masukkan harga tawar yang valid.'); return; }
    
    const offerAmount = Number(offerPrice);
    if (offerAmount > 10000000) {
      setErrorMsg('Tawaran maksimal adalah Rp 10.000.000');
      return;
    }
    
    if (product?.price && offerAmount < (product.price * 0.5)) {
      setErrorMsg(`Tawaran minimal adalah 50% dari harga barang (Rp ${(product.price * 0.5).toLocaleString('id-ID')})`);
      return;
    }

    setOffering(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, offerPrice: Number(offerPrice) }),
      });
      const data = await res.json();
      if (res.ok) {
        // Redirect to the chat room so seller sees the offer immediately
        if (data.roomId) {
          router.push(`/chat?roomId=${data.roomId}&productId=${id}&productTitle=${encodeURIComponent(product.title)}`);
        } else {
          setOfferSuccess(true);
          setOfferPrice('');
        }
      } else {
        setErrorMsg(data.message || 'Gagal mengirim penawaran.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan.');
    } finally { setOffering(false); }
  };

  const handleBuy = () => {
    if (!session) { setErrorMsg('Kamu harus login untuk membeli barang.'); return; }
    router.push(`/checkout/${id}`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title || 'JUBAGI',
          text: `Cek barang ini di JUBAGI: ${product?.title}`,
          url: url,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Tautan berhasil disalin ke clipboard!');
    }
  };

  const handleReport = async () => {
    if (!session) { alert('Harus login untuk melapor'); return; }
    if (!reportReason) { alert('Pilih alasan pelaporan'); return; }
    setReporting(true);
    try {
      const res = await fetch(`/api/products/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason, details: '' }),
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) setShowReportModal(false);
    } catch (err) {
      alert('Gagal mengirim laporan');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 pt-28 pb-20">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-muted-foreground transition-colors">Beranda</Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{product.title}</span>
        </nav>

        {/* Profile Alert */}
        {showProfileAlert && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl"></span>
            <div>
              <p className="font-bold text-amber-800 text-sm">Profil belum lengkap</p>
              <p className="text-amber-700 text-xs mt-1">Kamu perlu mengisi <strong>Nomor Telepon</strong> dan <strong>Alamat Pengiriman</strong> sebelum bisa membeli barang.</p>
              <Link href="/settings" className="inline-block mt-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                Lengkapi Profil Sekarang
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/*  Left: Photos & Description  */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <div className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border">
              <div className="relative aspect-[4/3] bg-muted group">
                <img src={photos[photoIndex]} alt={product.title} className="w-full h-full object-cover" />
                {photos.length > 1 && (
                  <>
                    <button onClick={prevPhoto} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={nextPhoto} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm ${isHibah ? 'bg-green-500' : 'bg-destructive'}`}>
                    {isHibah ? ' Hibah' : 'Dijual'}
                  </span>
                  {product.status !== 'available' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-slate-800 shadow-sm">
                      {product.status === 'given' ? 'Telah Dihibahkan' : 'Terjual'}
                    </span>
                  )}
                </div>
                {/* Share & Report Buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={handleShare} className="w-10 h-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105" title="Bagikan">
                    <Share2 className="w-5 h-5 text-gray-700" />
                  </button>
                  <button onClick={() => setShowReportModal(true)} className="w-10 h-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105" title="Laporkan Produk">
                    <Flag className="w-5 h-5 text-red-500" />
                  </button>
                </div>
                <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Images className="w-3 h-3" /> {photoIndex + 1}/{photos.length} foto
                </div>
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 p-4">
                  {photos.map((src, i) => (
                    <button key={i} onClick={() => setPhotoIndex(i)} className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === photoIndex ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                      <img src={src} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Detail Info */}
            <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
              <h1 className="text-2xl font-black text-foreground mb-2">{product.title}</h1>
              <div className="flex items-center gap-4 flex-wrap mb-4">
                <span className="text-sm bg-muted text-muted-foreground font-medium px-3 py-1 rounded-full">
                  {CONDITION_LABELS[product.condition] || product.condition}
                </span>
                {DEAL_LABELS[product.dealMethod] && (
                  <span className="text-sm flex items-center gap-1 text-muted-foreground">
                    {DEAL_LABELS[product.dealMethod].icon} {DEAL_LABELS[product.dealMethod].label}
                  </span>
                )}
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(product.location)}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm flex items-center gap-1 text-muted-foreground hover:text-primary hover:underline transition-colors cursor-pointer"
                  title="Lihat di Google Maps"
                >
                  <MapPin className="w-4 h-4" /> {product.location}
                </a>
                <span className="text-sm flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" /> {new Date(product.createdAt).toLocaleDateString('id-ID')}
                </span>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="font-bold text-foreground mb-2">Deskripsi</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {product.description || (isHibah ? 'Barang ini dihibahkan secara gratis. Ajukan permintaan hibah untuk mendapatkan barang ini.' : 'Tidak ada deskripsi.')}
                </p>
              </div>
              <div className="border-t border-border pt-4 mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase">Kategori</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{product.category}</p>
                </div>
                {product.brand && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Brand</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{product.brand}</p>
                  </div>
                )}
                {product.size && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Ukuran</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{product.size}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Seller Card */}
            <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Tentang Penjual
              </h3>
              <div className="flex items-center gap-4">
                <Link href={`/store/${product.sellerId}`} className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-200 to-primary flex items-center justify-center text-white font-bold text-xl shrink-0 group hover:ring-2 hover:ring-primary transition-all">
                  {product.sellerAvatar
                    ? <img src={product.sellerAvatar} alt="" className="w-full h-full rounded-full object-cover group-hover:opacity-90" />
                    : (product.sellerName || 'U').charAt(0).toUpperCase()
                  }
                </Link>
                <div className="flex-1">
                  <Link href={`/store/${product.sellerId}`} className="font-bold text-foreground hover:text-primary transition-colors block">{product.sellerName || 'Pengguna JUBAGI'}</Link>
                  <p className="text-xs text-muted-foreground">{product.sellerEmail}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className={`w-3.5 h-3.5 ${Number(product.sellerRating) > 0 ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                    <span className="text-xs font-bold text-foreground ml-0.5">{product.sellerRating}</span>
                    <span className="text-xs text-muted-foreground ml-1">({product.sellerReviewCount} ulasan)</span>
                  </div>
                </div>
                {!isOwner && (
                  <button onClick={handleChat} className="shrink-0 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" /> Chat
                  </button>
                )}
              </div>
            </div>

            {/* Owner: Hibah Requests */}
            {isOwner && isHibah && (
              <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                <button onClick={() => setShowHibahRequests(!showHibahRequests)} className="w-full flex items-center justify-between font-bold text-foreground">
                  <span className="flex items-center gap-2"> Daftar Pengaju Hibah</span>
                  <ChevronRight className={`w-5 h-5 transition-transform ${showHibahRequests ? 'rotate-90' : ''}`} />
                </button>
                {showHibahRequests && <div className="mt-4"><HibahRequestList productId={id} productTitle={product.title} productType={product.type} /></div>}
              </div>
            )}
          </div>

          {/*  Right: Actions  */}
          <div className="space-y-4">
            <div className="bg-card rounded-3xl p-6 shadow-sm border border-border sticky top-[140px]">
              {/* Price */}
              <div className="mb-5">
                <p className={`text-3xl font-black ${isHibah ? 'text-green-600' : 'text-foreground'}`}>
                  {isHibah ? 'Gratis ' : (product.price ? `Rp ${product.price.toLocaleString('id-ID')}` : 'Harga tidak tersedia')}
                </p>
                {!isHibah && <p className="text-xs text-muted-foreground mt-1">Harga dapat dinegosiasi</p>}
              </div>

              {/* Error message */}
              {errorMsg && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3 text-xs text-red-600 font-medium">{errorMsg}</div>
              )}

              {/* Like */}
              <button
                onClick={toggleLike}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-bold text-sm transition-all mb-3 ${liked ? 'border-primary bg-pink-50 text-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-primary' : ''}`} />
                {liked ? 'Disimpan' : 'Simpan'}  {likeCount}
              </button>

              {/* Actions */}
              {!isOwner && (
                <>
                  {isHibah ? (
                    <>
                      {hibahSuccess ? (
                        <div className="w-full py-3 bg-green-50 border-2 border-green-200 rounded-2xl text-center">
                          <p className="text-green-700 font-bold text-sm flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Pengajuan Terkirim!
                          </p>
                        </div>
                      ) : product.status === 'given' ? (
                        <button disabled className="w-full py-3.5 bg-gray-200 text-muted-foreground font-bold rounded-2xl text-sm cursor-not-allowed">
                          Barang Sudah Dihibahkan
                        </button>
                      ) : (
                        <button onClick={() => setShowHibahModal(true)} className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-green-500/20 hover:-translate-y-0.5 text-sm">
                           Ajukan Hibah
                        </button>
                      )}
                      <button onClick={handleChat} className="w-full mt-3 py-3 border-2 border-border hover:border-gray-300 text-muted-foreground font-bold rounded-2xl transition-all text-sm flex items-center justify-center gap-2 hover:bg-muted">
                        <MessageCircle className="w-4 h-4" /> Chat Pemilik
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Beli Langsung */}
                      {product.status !== 'available' ? (
                        <button disabled className="w-full py-3.5 bg-gray-200 text-muted-foreground font-bold rounded-2xl text-sm cursor-not-allowed mb-3">
                          Barang Terjual
                        </button>
                      ) : (
                        <button
                          onClick={handleBuy}
                          disabled={buying}
                          className="w-full py-3.5 bg-foreground hover:bg-foreground/90 text-background font-bold rounded-2xl transition-all shadow-lg shadow-gray-900/20 hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2 mb-3"
                        >
                          {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                          Beli Langsung
                        </button>
                      )}

                      {/* Chat Penjual */}
                      <button onClick={handleChat} className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2">
                        <MessageCircle className="w-4 h-4" /> Chat Penjual
                      </button>

                      {/* Tawar */}
                      {product.status === 'available' && (
                        offerSuccess ? (
                          <div className="mt-3 w-full py-3 bg-blue-50 border-2 border-blue-200 rounded-2xl text-center">
                            <p className="text-blue-700 font-bold text-sm flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-4 h-4" /> Penawaran Terkirim!
                            </p>
                          </div>
                        ) : (
                          <div className="mt-3 flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">Rp</span>
                              <input
                                type="number"
                                placeholder="Tawar harga"
                                value={offerPrice}
                                onChange={e => setOfferPrice(e.target.value)}
                                className="w-full pl-8 pr-3 py-2.5 border-2 border-border rounded-xl text-sm font-medium focus:outline-none focus:border-primary transition-colors"
                              />
                            </div>
                            <button
                              onClick={handleOffer}
                              disabled={offering}
                              className="px-4 py-2.5 bg-card border-2 border-foreground hover:bg-muted text-foreground font-bold rounded-xl text-sm transition-colors flex items-center gap-1.5"
                            >
                              {offering ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                              Tawar
                            </button>
                          </div>
                        )
                      )}
                    </>
                  )}
                </>
              )}

              {/* Owner Actions */}
              {isOwner && (
                <>
                  <button onClick={() => setShowBoostModal(true)} className="w-full mt-3 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors shadow-md shadow-amber-500/20 flex items-center justify-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Promosikan Iklan
                  </button>
                  {boostSuccess && (
                    <div className="mt-2 w-full py-2 bg-green-50 border border-green-200 rounded-xl text-center">
                      <p className="text-green-700 font-bold text-xs flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Berhasil Diajukan
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Link href={`/products/edit/${id}`} className="flex-1 py-2.5 flex items-center justify-center gap-1.5 bg-muted hover:bg-gray-200 text-foreground font-bold rounded-xl text-xs transition-colors">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors">
                      {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Hapus
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hibah Modal */}
      {showHibahModal && (
        <HibahRequestModal productId={id} onClose={() => setShowHibahModal(false)} onSuccess={() => setHibahSuccess(true)} />
      )}
      
      {/* Boost Modal */}
      {showBoostModal && (
        <BoostModal productId={id} onClose={() => setShowBoostModal(false)} onSuccess={() => { setShowBoostModal(false); setBoostSuccess(true); }} />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-[2rem] p-6 shadow-2xl">
            <h3 className="text-xl font-black text-foreground mb-4">Laporkan Produk</h3>
            <p className="text-sm text-muted-foreground mb-4">Pilih alasan mengapa produk ini melanggar aturan JUBAGI:</p>
            <div className="space-y-2 mb-6">
              {['Barang Ilegal/Terlarang', 'Palsu / Tiruan', 'Penipuan', 'Kategori Tidak Sesuai', 'Gambar Tidak Pantas'].map(reason => (
                <label key={reason} className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted transition-colors">
                  <input type="radio" name="report_reason" checked={reportReason === reason} onChange={() => setReportReason(reason)} className="text-primary focus:ring-primary w-4 h-4" />
                  <span className="text-sm font-bold text-foreground">{reason}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReportModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-bold text-sm">Batal</button>
              <button onClick={handleReport} disabled={reporting || !reportReason} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm disabled:opacity-50 flex justify-center items-center">
                {reporting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kirim Laporan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
