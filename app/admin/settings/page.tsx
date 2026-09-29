'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feeRate, setFeeRate] = useState('0.05');
  const toast = useToast();

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(async res => {
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          const fee = data.find(s => s.key === 'PLATFORM_FEE_RATE');
          if (fee) setFeeRate(fee.value);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'PLATFORM_FEE_RATE', value: feeRate })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Gagal menyimpan pengaturan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-foreground">Pengaturan Sistem</h1>
        <p className="text-muted-foreground text-sm mt-1">Konfigurasi fee admin dan pengaturan global JUBAGI</p>
      </div>

      <form onSubmit={handleSave} className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-6">
        <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-xl border border-primary/20">
          <TrendingUp className="w-6 h-6 text-primary mt-0.5" />
          <div>
            <h3 className="font-bold text-foreground">Biaya Layanan Admin (Platform Fee)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Persentase potongan yang akan dikenakan ke penjual dari total harga setiap transaksi sukses. 
              Contoh: 0.05 = 5%, 0.1 = 10%.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                required
                value={feeRate}
                onChange={e => setFeeRate(e.target.value)}
                className="px-4 py-2 bg-background border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none w-32"
              />
              <span className="text-sm font-bold text-muted-foreground">
                = {(Number(feeRate) * 100).toFixed(1)}% Potongan
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <button 
            type="submit" 
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-70"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
}
