'use client';

import { useState } from 'react';
import { Loader2, TrendingUp, X } from 'lucide-react';

interface Props {
  productId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function BoostModal({ productId, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState<3 | 7 | 30>(3);
  const [errorMsg, setErrorMsg] = useState('');

  const PACKAGES = {
    3: { label: '3 Hari', price: 15000 },
    7: { label: '7 Hari', price: 30000 },
    30: { label: '30 Hari', price: 100000 },
  };

  const handleBoost = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/boosts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, durationDays: duration }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess();
      } else {
        setErrorMsg(data.message || 'Gagal mengajukan iklan');
      }
    } catch (e) {
      setErrorMsg('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border flex justify-between items-center bg-card">
          <div className="flex items-center gap-2 text-foreground font-black text-xl">
            <TrendingUp className="w-5 h-5 text-amber-500" /> Promosikan Iklan
          </div>
          <button onClick={onClose} className="p-2 bg-muted hover:bg-gray-200 text-muted-foreground rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-sm text-muted-foreground mb-6">
            Pilih paket promosi untuk menaikkan posisi barangmu ke urutan pertama pencarian dan katalog JUBAGI!
          </p>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 mb-6">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-col gap-3 mb-6">
            {(Object.entries(PACKAGES) as [string, { label: string; price: number }][]).map(([days, pkg]) => (
              <label
                key={days}
                className={`relative flex items-center justify-between p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                  duration === Number(days) ? 'border-amber-400 bg-amber-50' : 'border-border hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="duration"
                    value={days}
                    checked={duration === Number(days)}
                    onChange={() => setDuration(Number(days) as any)}
                    className="w-4 h-4 text-amber-500 border-gray-300 focus:ring-amber-500"
                  />
                  <div className="font-bold text-foreground">{pkg.label}</div>
                </div>
                <div className="font-black text-amber-600">Rp {pkg.price.toLocaleString('id-ID')}</div>
              </label>
            ))}
          </div>

          <div className="bg-muted p-4 rounded-2xl text-xs text-muted-foreground space-y-2 mb-6">
            <p>• Setelah pembayaran selesai, pengajuan akan direview oleh admin JUBAGI.</p>
            <p>• Barang yang dipromosikan akan mendapat badge <strong className="text-amber-500">IKLAN</strong>.</p>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-card">
          <button
            onClick={handleBoost}
            disabled={loading}
            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20 hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lanjut Pembayaran (Simulasi)'}
          </button>
        </div>
      </div>
    </div>
  );
}
