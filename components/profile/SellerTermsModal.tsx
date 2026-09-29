'use client';

import { useState } from 'react';
import { ShieldAlert, CheckCircle2, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

export function SellerTermsModal({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const [agreements, setAgreements] = useState({
    original: false,
    fee: false,
    responsibility: false,
    fraud: false,
  });

  const isAllAgreed = Object.values(agreements).every(v => v === true);

  const handleAgree = async () => {
    if (!isAllAgreed) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/user/accept-seller-terms', { method: 'POST' });
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
            Untuk menjaga keamanan dan kenyamanan komunitas JUBAGI, setiap penjual wajib mematuhi aturan berikut. Silakan centang semua poin untuk melanjutkan.
          </p>

          <label className="flex items-start gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
            <input 
              type="checkbox" 
              className="mt-1 w-5 h-5 accent-primary cursor-pointer"
              checked={agreements.original}
              onChange={e => setAgreements(prev => ({ ...prev, original: e.target.checked }))}
            />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-foreground">Kondisi Barang Riil</h4>
              <p className="text-xs text-muted-foreground mt-1">Saya menjamin bahwa foto dan deskripsi barang yang diupload sesuai dengan kondisi aslinya.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
            <input 
              type="checkbox" 
              className="mt-1 w-5 h-5 accent-primary cursor-pointer"
              checked={agreements.fee}
              onChange={e => setAgreements(prev => ({ ...prev, fee: e.target.checked }))}
            />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-foreground">Persetujuan Biaya Layanan</h4>
              <p className="text-xs text-muted-foreground mt-1">Saya setuju bahwa JUBAGI akan memotong biaya admin layanan (platform fee) dari setiap transaksi sukses sesuai tarif yang berlaku.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
            <input 
              type="checkbox" 
              className="mt-1 w-5 h-5 accent-primary cursor-pointer"
              checked={agreements.responsibility}
              onChange={e => setAgreements(prev => ({ ...prev, responsibility: e.target.checked }))}
            />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-foreground">Tanggung Jawab Pengiriman</h4>
              <p className="text-xs text-muted-foreground mt-1">Saya bertanggung jawab penuh atas proses pengemasan dan pengiriman barang agar aman sampai tujuan.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
            <input 
              type="checkbox" 
              className="mt-1 w-5 h-5 accent-primary cursor-pointer"
              checked={agreements.fraud}
              onChange={e => setAgreements(prev => ({ ...prev, fraud: e.target.checked }))}
            />
            <div className="flex-1">
              <h4 className="font-bold text-sm text-foreground">Larangan Penipuan</h4>
              <p className="text-xs text-muted-foreground mt-1">Saya tidak akan melakukan penipuan atau mengarahkan transaksi di luar sistem keamanan JUBAGI. Akun akan dibanned jika melanggar.</p>
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
            disabled={!isAllAgreed || loading}
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
