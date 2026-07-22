'use client';

import { useState, useRef, useCallback } from 'react';
import { 
  Upload, X, ChevronDown, ChevronUp, CheckCircle2, 
  ImagePlus, Tag, ArrowRight, Loader2
} from 'lucide-react';
import { CATEGORIES } from '@/lib/categories';
import { supabase } from '@/lib/supabase';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
import { PROVINCES } from '@/lib/provinces';

// --- Types --------------------------------------------------------------------

type Step = 'upload' | 'category' | 'detail';

const CONDITIONS = [
  { value: 'brand_new',     label: 'Baru' },
  { value: 'like_new',      label: 'Seperti Baru' },
  { value: 'lightly_used',  label: 'Jarang Dipakai' },
  { value: 'well_used',     label: 'Sering Dipakai' },
  { value: 'heavily_used',  label: 'Sangat Sering Dipakai' },
];

const DEAL_METHODS = [
  { value: 'pickup',   label: 'Ambil di Rumah' },
  { value: 'delivery', label: 'Pengantaran' },
  { value: 'both',     label: 'Keduanya' },
];

// --- Icon renderer ------------------------------------------------------------

const renderIcon = (iconName: string, size = 'w-6 h-6') => {
  const I = (LucideIcons as any)[iconName];
  return I ? <I className={size} /> : <LucideIcons.Box className={size} />;
};

// --- Main Component -----------------------------------------------------------

export function SellFormView() {
  const { data: session } = useSession();
  const router = useRouter();

  // -- Step state --------------------------------------------------------------
  const [step, setStep] = useState<Step>('upload');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // -- Photo state -------------------------------------------------------------
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- Form state --------------------------------------------------------------
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [title, setTitle]           = useState('');
  const [condition, setCondition]   = useState('');
  const [listingType, setListingType] = useState<'jual' | 'hibah'>('jual');
  const [price, setPrice]           = useState('');
  const [description, setDescription] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [size, setSize]             = useState('');
  const [brand, setBrand]           = useState('');
  const [dealMethod, setDealMethod] = useState('');
  const [location, setLocation]     = useState('');
  const [cityDistrict, setCityDistrict] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [showHibahConfirm, setShowHibahConfirm] = useState(false);

  // -- Derived -----------------------------------------------------------------
  const selectedCategory = CATEGORIES.find(c => c.id === selectedCategoryId);
  const allSubItems = selectedCategory?.subcategories.flatMap(s => s.items) ?? [];

  // --- Photo handlers -------------------------------------------------------

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 10 - photos.length;
    const newFiles = Array.from(files).slice(0, remaining);
    const newPreviews = newFiles.map(f => URL.createObjectURL(f));
    setPhotos(prev => [...prev, ...newFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(previews[idx]);
    setPhotos(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [photos]);

  const handlePhotosConfirm = () => {
    if (photos.length === 0) return;
    setStep('category');
  };

  // --- Submit ---------------------------------------------------------------

  const handleSubmit = async () => {
    if (!title || !condition || !dealMethod || !selectedCategoryId || !location || !cityDistrict) {
      setSubmitError('Lengkapi semua kolom wajib (termasuk Kota dan Provinsi).');
      return;
    }
    setSubmitting(true);
    setSubmitError('');

    try {
      // 1. Upload photos to Supabase Storage
      const uploadedUrls: string[] = [];
      for (const photo of photos) {
        const ext = photo.name.split('.').pop();
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        
        try {
          const { data, error } = await supabase.storage
            .from('products')
            .upload(path, photo, { upsert: false });
          if (error) throw error;
          
          const { data: urlData } = supabase.storage.from('products').getPublicUrl(data.path);
          uploadedUrls.push(urlData.publicUrl);
        } catch (supabaseErr: any) {
          console.error("Supabase Upload Error:", supabaseErr);
          throw new Error("Gagal mengunggah gambar ke Supabase. Pastikan bucket 'products' sudah dibuat dan Public.");
        }
      }

      // 2. Create product via API
      let res;
      try {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            condition,
            type: listingType,
            price: listingType === 'jual' ? Number(price.replace(/\D/g, '')) : null,
            description,
            categoryId: selectedCategoryId,
            subCategory,
            size,
            brand,
            dealMethod,
            location: cityDistrict ? `${cityDistrict}, ${location}` : location,
            images: uploadedUrls,
          }),
        });
      } catch (fetchErr: any) {
        console.error("API Fetch Error:", fetchErr);
        throw new Error("Koneksi terputus saat menyimpan data (API /api/products gagal). Coba matikan AdBlocker.");
      }

      if (!res.ok) {
        let errMessage = 'Gagal menyimpan produk.';
        try {
          const err = await res.json();
          errMessage = err.message || errMessage;
        } catch(e) {}
        throw new Error(errMessage);
      }

      router.push('/');
    } catch (err: any) {
      console.error("Submit Exception:", err);
      setSubmitError(err.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // --- Render ---------------------------------------------------------------

  return (
    <div className="flex gap-6 items-start transition-all duration-500">
      
      {/* === PHOTO CARD ===================================================== */}
      <div
        className={`transition-all duration-500 ease-in-out shrink-0 ${
          step === 'upload' ? 'w-full' : 'w-[38%]'
        }`}
      >
        <div className="bg-card rounded-3xl shadow-md border border-border overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-foreground">Foto Produk</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Maks. 10 foto  Klik atau seret ke sini</p>
              </div>
              {photos.length > 0 && (
                <span className="text-xs font-bold bg-pink-50 dark:bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {photos.length}/10
                </span>
              )}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => photos.length < 10 && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                dragging
                  ? 'border-primary bg-pink-50 dark:bg-primary/10'
                  : 'border-border hover:border-primary hover:bg-pink-50/30 dark:hover:bg-primary/5'
              } ${step === 'upload' ? 'min-h-[280px]' : 'min-h-[180px]'} flex flex-col items-center justify-center gap-3`}
            >
              {photos.length === 0 ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-pink-50 dark:bg-primary/10 flex items-center justify-center">
                    <ImagePlus className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground">Klik untuk unggah foto</p>
                    <p className="text-xs text-muted-foreground mt-1">atau seret & lepas di sini</p>
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (maks. 10 MB/foto)</p>
                </>
              ) : (
                <div className={`grid ${step === 'upload' ? 'grid-cols-4' : 'grid-cols-2'} gap-3 p-3 w-full`}>
                  {previews.map((src, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={src} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={e => { e.stopPropagation(); removePhoto(idx); }}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5 text-white" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-md">
                          Utama
                        </span>
                      )}
                    </div>
                  ))}
                  {photos.length < 10 && (
                    <div className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:border-primary transition-colors">
                      <ImagePlus className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>
              )}
              <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => addFiles(e.target.files)} />
            </div>

            {/* Confirm button */}
            {step === 'upload' && photos.length > 0 && (
              <button
                onClick={handlePhotosConfirm}
                className="mt-5 w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-2xl transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 shadow-lg shadow-primary/20"
              >
                Lanjutkan <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* === RIGHT CARD ====================================================== */}
      {step !== 'upload' && (
        <div className="flex-1 transition-all duration-500">
          <div className="bg-card rounded-3xl shadow-md border border-border">
            
            {/* -- Pilih Kategori -- */}
            {step === 'category' && (
              <div className="p-6">
                <h2 className="text-lg font-black text-foreground mb-1">Pilih Kategori</h2>
                <p className="text-xs text-muted-foreground mb-5">Pilih kategori yang paling sesuai untuk barang kamu</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setStep('detail');
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border hover:border-primary hover:bg-pink-50/50 dark:hover:bg-primary/10 transition-all group`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cat.iconBgColor} ${cat.iconTextColor} group-hover:scale-110 transition-transform`}>
                        {renderIcon(cat.iconName, 'w-5 h-5')}
                      </div>
                      <span className="text-xs font-bold text-muted-foreground text-center leading-tight group-hover:text-foreground">
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* -- Detail Form -- */}
            {step === 'detail' && (
              <div className="p-6 space-y-5">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-foreground">Detail Barang</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kategori: <span className="font-bold text-primary">{selectedCategory?.name}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setStep('category')}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Ganti kategori
                  </button>
                </div>

                {/* Judul */}
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">
                    Judul Barang <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: iPhone 13 Pro Max 256GB"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={100}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                {/* Kondisi */}
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Kondisi Barang <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setCondition(c.value)}
                        className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                          condition === c.value
                            ? 'border-primary bg-pink-50 dark:bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipe Harga */}
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Tipe Penawaran <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-3">
                    {(['jual', 'hibah'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => {
                          setListingType(t);
                          if (t === 'hibah') setPrice('');
                        }}
                        className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                          listingType === t
                            ? t === 'jual' ? 'border-primary bg-pink-50 dark:bg-primary/10 text-primary' : 'border-green-400 bg-green-50 dark:bg-green-500/10 text-green-600'
                            : 'border-border text-muted-foreground hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {t === 'jual' ? 'Dijual' : 'Dihibahkan'}
                      </button>
                    ))}
                  </div>

                  {listingType === 'jual' && (
                    <div className="mt-3 relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">Rp</span>
                      <input
                        type="text"
                        placeholder="0"
                        value={price}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setPrice(raw ? Number(raw).toLocaleString('id-ID') : '');
                        }}
                        className="w-full rounded-xl border border-border pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">
                    Deskripsi <span className="text-muted-foreground font-normal">(Opsional)</span>
                  </label>
                  <textarea
                    placeholder="Ceritakan detail barang, kondisi, alasan jual, dll..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                  />
                </div>

                {/* Sub Kategori */}
                {allSubItems.length > 0 && (
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-1.5">
                      Tipe Barang
                    </label>
                    <select
                      value={subCategory}
                      onChange={e => setSubCategory(e.target.value)}
                      className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-card"
                    >
                      <option value="">-- Pilih tipe --</option>
                      {allSubItems.map(item => (
                        <option key={item.name} value={item.name}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Ukuran */}
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">
                    Ukuran <span className="text-muted-foreground font-normal">(Opsional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: XL, 39, 42cm x 30cm"
                    value={size}
                    onChange={e => setSize(e.target.value)}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                {/* Detail Opsional - show/hide */}
                <div>
                  <button
                    onClick={() => setShowOptional(!showOptional)}
                    className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
                  >
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${showOptional ? 'border-primary bg-pink-50 dark:bg-primary/10 text-primary' : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400'}`}>
                      {showOptional ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                    {showOptional ? 'Sembunyikan Detail Tambahan' : 'Tampilkan Detail Tambahan'}
                  </button>

                  {showOptional && (
                    <div className="mt-3 p-4 bg-muted rounded-2xl border border-border">
                      <label className="block text-sm font-bold text-foreground mb-1.5">
                        Merek / Brand <span className="text-muted-foreground font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Nike, Apple, Samsung"
                        value={brand}
                        onChange={e => setBrand(e.target.value)}
                        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Metode Transaksi */}
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    Metode Transaksi <span className="text-red-400">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DEAL_METHODS.map(d => (
                      <button
                        key={d.value}
                        onClick={() => setDealMethod(d.value)}
                        className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          dealMethod === d.value
                            ? 'border-foreground bg-foreground text-white'
                            : 'border-border text-muted-foreground hover:border-gray-300'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lokasi / Provinsi */}
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">
                    Lokasi / Provinsi <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-card"
                  >
                    <option value="">-- Pilih Provinsi --</option>
                    {PROVINCES.filter(p => p !== 'Seluruh Indonesia').map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                {/* Kota / Kecamatan */}
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">
                    Kota / Kecamatan <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Kota Semarang, Kec. Banyumanik"
                    value={cityDistrict}
                    onChange={e => setCityDistrict(e.target.value)}
                    className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-card"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Membantu pembeli mengetahui estimasi jarak dan ongkos kirim.</p>
                </div>

                {/* Error */}
                {submitError && (
                  <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
                    {submitError}
                  </p>
                )}

                {/* Submit */}
                <button
                  onClick={() => {
                    if (listingType === 'hibah') {
                      if (!title || !condition || !dealMethod || !selectedCategoryId || !location || !cityDistrict) {
                        setSubmitError('Lengkapi semua kolom wajib (termasuk Kota dan Provinsi).');
                        return;
                      }
                      setShowHibahConfirm(true);
                    } else {
                      if (!title || !condition || !dealMethod || !selectedCategoryId || !location || !cityDistrict) {
                        setSubmitError('Lengkapi semua kolom wajib (termasuk Kota dan Provinsi).');
                        return;
                      }
                      handleSubmit();
                    }
                  }}
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-black py-4 rounded-2xl transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-base"
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Sedang Memproses...</>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5" /> Pasang Iklan Sekarang</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === HIBAH CONFIRMATION MODAL === */}
      {showHibahConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-border animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">Konfirmasi Hibah</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Apakah kamu yakin ingin menghibahkan barang ini (memberikan secara gratis)?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowHibahConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-border font-bold text-sm text-foreground hover:bg-muted transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setShowHibahConfirm(false);
                    handleSubmit();
                  }}
                  className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20"
                >
                  Ya, Hibahkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
