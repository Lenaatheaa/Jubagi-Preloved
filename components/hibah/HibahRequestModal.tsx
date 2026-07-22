'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface Props {
  productId: string | number;
  onClose: () => void;
  onSuccess: () => void;
}

export function HibahRequestModal({ productId, onClose, onSuccess }: Props) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!message.trim()) { setError('Alasan wajib diisi.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/hibah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="mb-5">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mb-3">
            <span className="text-2xl"></span>
          </div>
          <h2 className="text-xl font-black text-foreground">Ajukan Hibah</h2>
          <p className="text-sm text-muted-foreground mt-1">Ceritakan kenapa kamu layak mendapatkan barang ini</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-foreground mb-2">
            Alasan Pengajuan <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Contoh: Saya sangat membutuhkan barang ini karena..."
            className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/30 focus:border-green-400 transition-all resize-none"
          />
          <p className="text-xs text-muted-foreground mt-1">{message.length}/500 karakter</p>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl mb-4 border border-red-100">{error}</p>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border-2 border-border font-bold text-muted-foreground hover:bg-muted transition-colors text-sm">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</> : ' Ajukan Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
}
