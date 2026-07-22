'use client';

import Script from 'next/script';

import { useState, useEffect, use, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin, Phone, User, Package, Truck, CreditCard,
  ChevronRight, Edit2, CheckCircle2, Loader2, X, ShieldCheck, ArrowLeft
} from 'lucide-react';

declare global {
  interface Window { snap: any; }
}

const CONDITION_LABELS: Record<string, string> = {
  brand_new: 'Baru',
  like_new: 'Seperti Baru',
  lightly_used: 'Jarang Dipakai',
  well_used: 'Sering Dipakai',
  heavily_used: 'Sangat Sering Dipakai',
};



function getEstimatedDate(days: string): string {
  const now = new Date();
  const match = days.match(/(\d+)-(\d+)/);
  if (!match) {
    const single = days.match(/(\d+)/);
    if (!single) return 'Sesuai kesepakatan';
    const d1 = new Date();
    d1.setDate(now.getDate() + parseInt(single[0]));
    return d1.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  
  const minDays = parseInt(match[1]);
  const maxDays = parseInt(match[2]);
  
  const date1 = new Date();
  date1.setDate(now.getDate() + minDays);
  const date2 = new Date();
  date2.setDate(now.getDate() + maxDays);
  
  const d1Str = date1.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });
  const d2Str = date2.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${d1Str} - ${d2Str}`;
}

// removed hardcoded shipping logic

export default function CheckoutPage({ params }: { params: Promise<{ productId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
       <CheckoutContent params={params} />
    </Suspense>
  )
}

function CheckoutContent({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerPriceParam = searchParams.get('offerPrice');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingAddress, setEditingAddress] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  const [shipping, setShipping] = useState('jne_reg');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('qris');

  const PAYMENT_METHODS = [
    { id: 'qris', name: 'QRIS', desc: 'Gopay, OVO, DANA, LinkAja', icon: '' },
    { id: 'bca_va', name: 'BCA Virtual Account', desc: 'Otomatis dicek (BCA Mobile/ATM)', icon: '' },
    { id: 'bni_va', name: 'BNI Virtual Account', desc: 'Otomatis dicek (BNI Mobile/ATM)', icon: '' },
    { id: 'mandiri_va', name: 'Mandiri Virtual Account', desc: 'Otomatis dicek (Livin/ATM)', icon: '' },
    { id: 'permata_va', name: 'Permata Virtual Account', desc: 'Otomatis dicek (PermataMobile/ATM)', icon: '' },
  ];

  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [loadingShipping, setLoadingShipping] = useState(false);

  useEffect(() => {
    fetch(`/api/checkout/${productId}`)
      .then(r => r.json())
      .then(d => {
        if (d.message) { setError(d.message); return; }
        setData(d);
        setName(d.user.name);
        setPhone(d.user.phone);
        setAddress(d.user.address);
      })
      .catch(() => setError('Gagal memuat data checkout.'))
      .finally(() => setLoading(false));
  }, [productId]);

  // Fetch Shipping Rates when Address changes
  useEffect(() => {
    if (!address || address.trim().length < 3) return;
    
    setLoadingShipping(true);
    
    // Gunakan debounce ringan agar tidak fetch berulang kali saat mengetik
    const timer = setTimeout(() => {
      fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: address, weight: 1500 }), // default weight 1.5kg
      })
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setShippingOptions(resData.results);
          // Set default selected jika yang lama tidak ada di list baru
          if (!resData.results.find((s:any) => s.id === shipping)) {
            setShipping(resData.results[0].id);
          }
        }
      })
      .finally(() => setLoadingShipping(false));
    }, 800);

    return () => clearTimeout(timer);
  }, [address]);

  const handleSaveAddress = async () => {
    setSavingAddress(true);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address, avatar: data?.user?.avatar || '' }),
      });
      setEditingAddress(false);
    } catch {
      alert('Gagal menyimpan alamat.');
    } finally {
      setSavingAddress(false);
    }
  };

  const defaultShipping = { id: 'pickup', label: 'Ambil Sendiri', price: 0, name: 'Ambil Sendiri', days: 'Sesuai kesepakatan' };
  const selectedShipping = shippingOptions.find(s => s.id === shipping) || defaultShipping;
  const isHibah = data?.product?.isHibah;
  
  // Use offerPrice if available, otherwise fallback to product price
  const basePrice = offerPriceParam ? Number(offerPriceParam) : (data?.product?.price || 0);
  const productPrice = isHibah ? 0 : basePrice;
  const shippingPrice = (isHibah || shipping === 'pickup') ? 0 : selectedShipping.price;
  const total = productPrice + shippingPrice;

  const handlePay = async () => {
    if (!address || !phone) {
      setPayError('Harap lengkapi alamat dan nomor telepon terlebih dahulu.');
      return;
    }
    setPaying(true);
    setPayError('');
    try {
      console.log('Sending POST to /api/transactions...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           productId, 
           shippingMethod: shipping, 
           paymentMethod,
           offerPrice: offerPriceParam ? Number(offerPriceParam) : undefined
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      console.log('Response received:', res.status);
      const result = await res.json();
      console.log('Response body:', result);

      if (result.missingProfile) {
        setPayError('Profil belum lengkap. Silakan isi nama, telepon, dan alamat.');
        setPaying(false);
        return;
      }
      if (!res.ok) {
        setPayError(result.message || 'Terjadi kesalahan pada server (API).');
        setPaying(false);
        return;
      }

      // Produk hibah  langsung redirect ke halaman sukses
      if (result.isHibah) {
        router.push(`/checkout/${productId}/success?id=${result.transactionId}&hibah=1`);
        return;
      }

      // Produk berbayar  Redirect ke halaman Midtrans Hosted (Bypass bug snap.js)
      console.log('Redirecting to Midtrans Hosted Payment Page...');
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        setPayError('Sistem gagal mendapatkan URL pembayaran dari Midtrans.');
        setPaying(false);
      }
    } catch (err: any) {
      console.error("Fetch Exception:", err);
      if (err.name === 'AbortError') {
        setPayError('Koneksi ke server JUBAGI terputus (Timeout 15 detik). API menggantung.');
      } else {
        setPayError('Terjadi kesalahan tidak terduga: ' + err.message);
      }
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium">Memuat checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500 font-bold">{error}</p>
          <Link href="/" className="text-primary underline text-sm">Kembali ke beranda</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-muted pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 lg:px-6">

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="w-10 h-10 bg-card rounded-full flex items-center justify-center border border-border shadow-sm hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-foreground">Checkout</h1>
              <p className="text-muted-foreground text-sm">Periksa detail pesanan Anda sebelum membayar</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/*  LEFT COLUMN  */}
            <div className="lg:col-span-3 space-y-5">

              {/* Alamat Pengiriman */}
              <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-pink-50 rounded-xl flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-bold text-foreground">Alamat Pengiriman</span>
                  </div>
                  {!editingAddress && (
                    <button
                      onClick={() => setEditingAddress(true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors bg-pink-50 px-3 py-1.5 rounded-lg"
                    >
                      <Edit2 className="w-3 h-3" /> Ubah
                    </button>
                  )}
                </div>

                <div className="px-6 py-5">
                  {editingAddress ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Nama Penerima</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Nama lengkap"
                            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">No. Telepon</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="08xxxxxxxxxx"
                            type="tel"
                            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Alamat Lengkap</label>
                        <textarea
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          placeholder="Jalan, No. Rumah, RT/RW, Kelurahan, Kecamatan, Kota, Provinsi, Kode Pos"
                          rows={3}
                          className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors resize-none"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setEditingAddress(false)} className="flex-1 py-2.5 border border-border text-muted-foreground font-bold text-sm rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-1.5">
                          <X className="w-3.5 h-3.5" /> Batal
                        </button>
                        <button
                          onClick={handleSaveAddress}
                          disabled={savingAddress}
                          className="flex-1 py-2.5 bg-primary text-white font-bold text-sm rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                        >
                          {savingAddress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Simpan
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="font-bold text-foreground text-sm">{name || <span className="text-red-400 italic">Belum diisi</span>}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{phone || <span className="text-red-400 italic">No. telepon belum diisi</span>}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-sm text-foreground leading-relaxed">
                          {address || <span className="text-red-400 italic">Alamat belum diisi</span>}
                        </p>
                      </div>
                      {(!name || !phone || !address) && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                          <span className="text-amber-500 text-base"></span>
                          <p className="text-xs text-amber-700 font-medium">Harap lengkapi semua data pengiriman sebelum melanjutkan pembayaran.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Produk Dipesan + Pengiriman dalam satu frame */}
              <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                {/* Produk */}
                <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-muted rounded-xl flex items-center justify-center">
                    <Package className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="font-bold text-foreground">Produk Dipesan</span>
                </div>
                <div className="px-6 py-5">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted shrink-0 border border-border">
                      {data.product.image
                        ? <img src={data.product.image} alt={data.product.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-muted-foreground text-2xl"></div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1.5 ${isHibah ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {isHibah ? ' Hibah Gratis' : 'Dijual'}
                      </span>
                      <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2">{data.product.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{CONDITION_LABELS[data.product.condition] || data.product.condition}  {data.product.category}</p>
                      <p className="text-xs text-muted-foreground">Penjual: {data.product.sellerName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">Harga</p>
                      <p className={`font-black text-base ${isHibah ? 'text-green-600' : 'text-foreground'}`}>
                        {isHibah ? 'Gratis' : `Rp ${productPrice.toLocaleString('id-ID')}`}
                      </p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-5 border-t border-dashed border-border" />

                  {/* Opsi Pengiriman */}
                  <div className="flex items-center gap-2 mb-4">
                    <Truck className="w-4 h-4 text-muted-foreground" />
                    <span className="font-bold text-foreground text-sm">Opsi Pengiriman</span>
                  </div>

                  <div className="space-y-2.5 relative">
                    {loadingShipping && (
                      <div className="absolute inset-0 bg-card/60 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-2xl">
                        <div className="flex items-center gap-2 bg-background shadow-md border border-border px-4 py-2 rounded-xl text-sm font-medium text-primary">
                          <Loader2 className="w-4 h-4 animate-spin" /> Menghitung Ongkir...
                        </div>
                      </div>
                    )}
                    {shippingOptions.length === 0 && !loadingShipping && (
                      <div className="p-4 border-2 border-dashed border-border rounded-2xl text-center text-sm text-muted-foreground">
                        Masukkan alamat pengiriman untuk melihat opsi kurir (API Terhubung)
                      </div>
                    )}
                    {shippingOptions.map(opt => {
                      const isSelected = shipping === opt.id;
                      const actualPrice = isHibah ? 0 : opt.price;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setShipping(opt.id)}
                          className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                            isSelected
                              ? 'border-primary bg-pink-50/50'
                              : 'border-border hover:border-border bg-muted/50'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 font-bold ${isSelected ? 'bg-pink-100 text-primary' : 'bg-card border border-border text-muted-foreground'}`}>
                            {opt.courier?.charAt(0) || <Truck className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <p className={`font-bold text-sm ${isSelected ? 'text-foreground' : 'text-foreground'}`}>{opt.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Estimasi tiba: <span className="font-semibold text-foreground">{getEstimatedDate(opt.days)}</span>
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-black text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {actualPrice === 0 ? 'Gratis' : `Rp ${actualPrice.toLocaleString('id-ID')}`}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                            {isSelected && <div className="w-2 h-2 bg-card rounded-full" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-bold text-foreground">Metode Pembayaran</span>
                </div>
                <div className="px-6 py-5">
                  {isHibah ? (
                    <div className="flex items-center gap-4 p-4 bg-green-50 border-2 border-green-200 rounded-2xl">
                      <span className="text-3xl"></span>
                      <div>
                        <p className="font-bold text-green-800">Produk Hibah  Gratis!</p>
                        <p className="text-xs text-green-600 mt-0.5">Tidak diperlukan pembayaran untuk produk hibah.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {PAYMENT_METHODS.map(pm => (
                        <label 
                          key={pm.id} 
                          className={`flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                            paymentMethod === pm.id 
                              ? 'border-primary bg-pink-50 shadow-sm' 
                              : 'border-border bg-card hover:border-border'
                          }`}
                          onClick={() => setPaymentMethod(pm.id)}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl ${
                            paymentMethod === pm.id ? 'bg-card shadow-sm' : 'bg-muted'
                          }`}>
                            {pm.icon}
                          </div>
                          <div className="flex-1">
                            <p className={`font-black ${paymentMethod === pm.id ? 'text-foreground' : 'text-foreground'}`}>
                              {pm.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{pm.desc}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            paymentMethod === pm.id ? 'border-primary bg-primary' : 'border-gray-300'
                          }`}>
                            {paymentMethod === pm.id && <div className="w-2 h-2 bg-card rounded-full" />}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                    <span>Transaksi Anda dilindungi dan diproses secara aman oleh <strong className="text-muted-foreground">Midtrans</strong>.</span>
                  </div>
                </div>
              </div>

            </div>

            {/*  RIGHT COLUMN: Ringkasan & Bayar  */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden sticky top-24">
                <div className="px-6 py-4 border-b border-gray-50">
                  <h2 className="font-bold text-foreground">Ringkasan Pembayaran</h2>
                </div>
                <div className="px-6 py-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Harga Produk</span>
                    <span className="font-semibold text-foreground">
                      {isHibah ? 'Gratis' : `Rp ${productPrice.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ongkos Kirim ({selectedShipping.name || selectedShipping.label})</span>
                    <span className="font-semibold text-foreground">
                      {shippingPrice === 0 ? 'Gratis' : `Rp ${shippingPrice.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  <div className="border-t border-dashed border-border pt-3 flex justify-between">
                    <span className="font-black text-foreground">Total Bayar</span>
                    <span className={`font-black text-lg ${isHibah ? 'text-green-600' : 'text-foreground'}`}>
                      {total === 0 ? 'Gratis' : `Rp ${total.toLocaleString('id-ID')}`}
                    </span>
                  </div>

                  {payError && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600 font-medium">
                      {payError}
                    </div>
                  )}

                  <button
                    onClick={handlePay}
                    disabled={paying || !name || !phone || !address}
                    className={`w-full py-4 rounded-2xl font-black text-sm transition-all shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isHibah
                        ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20'
                        : 'bg-foreground hover:bg-foreground/90 text-background shadow-gray-900/20 hover:-translate-y-0.5'
                    }`}
                  >
                    {paying
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                      : isHibah
                        ? <><span></span> Selesaikan Pesanan Hibah</>
                        : <><CreditCard className="w-4 h-4" /> Bayar dengan QRIS</>
                    }
                  </button>

                  <p className="text-center text-xs text-muted-foreground pt-1">
                    Dengan melanjutkan, Anda menyetujui <span className="text-primary font-semibold">Syarat & Ketentuan</span> JUBAGI.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
