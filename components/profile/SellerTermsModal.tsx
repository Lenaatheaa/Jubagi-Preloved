'use client';

import { useState } from 'react';
import { ShieldAlert, CheckCircle2, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

import { Phone } from 'lucide-react';

export function SellerTermsModal({ onSuccess, initialPhone }: { onSuccess: () => void; initialPhone: string }) {
  const [phone, setPhone] = useState(initialPhone);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const [agreed, setAgreed] = useState(false);

  const handleAgree = async () => {
    if (!agreed) return;
    if (!phone || phone.length < 10) {
      toast.error('Mohon isi Nomor WhatsApp dengan benar (minimal 10 digit).');
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch('/api/user/accept-seller-terms', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if (res.ok) {
        toast.success('Persetujuan berhasil! Selamat berjualan.');
        onSuccess();
      } else {
        toast.error('Terjadi kesalahan, silakan coba lagi.');
      }
    } catch (err) {
      toast.error('Gagal memproses persetujuan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">Ketentuan Berjualan</h2>
              <p className="text-sm text-muted-foreground">Wajib disetujui sebelum mengupload barang.</p>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-sm text-foreground/80 leading-relaxed mb-2">
            Untuk menjaga keamanan dan kenyamanan komunitas JUBAGI, setiap penjual wajib mencantumkan nomor telepon aktif dan mematuhi aturan berikut.
          </p>

          <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 mb-4">
            <h4 className="font-bold text-sm text-foreground mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary" />
              Nomor WhatsApp Aktif
            </h4>
            <input 
              type="tel" 
              placeholder="Contoh: 08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            />
            <p className="text-xs text-muted-foreground mt-2">Nomor ini diperlukan untuk keperluan komunikasi transaksi atau jika ada kendala.</p>
          </div>

          <div className="bg-muted/30 p-4 rounded-xl border border-border max-h-48 overflow-y-auto space-y-4 text-sm text-foreground/80 mb-4">
            <div>
              <h4 className="font-bold text-foreground">1. Kondisi Barang Riil</h4>
              <p className="mt-1">Saya menjamin bahwa foto dan deskripsi barang yang diupload sesuai dengan kondisi aslinya.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground">2. Persetujuan Biaya Layanan</h4>
              <p className="mt-1">Saya setuju bahwa JUBAGI akan memotong biaya admin layanan (platform fee) dari setiap transaksi sukses sesuai tarif yang berlaku.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground">3. Tanggung Jawab Pengiriman</h4>
              <p className="mt-1">Saya bertanggung jawab penuh atas proses pengemasan dan pengiriman barang agar aman sampai tujuan.</p>
            </div>
            <div>
              <h4 className="font-bold text-foreground">4. Larangan Penipuan</h4>
              <p className="mt-1">Saya tidak akan melakukan penipuan atau mengarahkan transaksi di luar sistem keamanan JUBAGI. Akun akan dibanned jika melanggar.</p>
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 border border-primary/30 bg-primary/5 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
            <input 
              type="checkbox" 
              className="mt-1 w-5 h-5 accent-primary cursor-pointer shrink-0"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
            />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-foreground">Saya setuju</h4>
              <p className="text-xs text-muted-foreground mt-1">Saya telah membaca, memahami, dan menyetujui seluruh Ketentuan Berjualan di atas.</p>
            </div>
          </label>
        </div>

        <div className="p-6 border-t border-border bg-muted/10 flex gap-3 justify-end">
          <button 
            onClick={() => router.push('/')}
            className="px-6 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors"
          >
            Batal Jual
          </button>
          <button 
            onClick={handleAgree}
            disabled={!agreed || loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Setuju & Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}
