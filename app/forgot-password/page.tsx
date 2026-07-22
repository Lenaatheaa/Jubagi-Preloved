'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        if (data.previewUrl) {
          setPreviewUrl(data.previewUrl);
        }
      } else {
        alert(data.message || 'Gagal mengirim email reset');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat mengirim email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-3xl p-8 shadow-xl border border-border text-center">
        {!success ? (
          <>
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-black mb-2 text-foreground">Lupa Password?</h1>
            <p className="text-muted-foreground text-sm mb-8">
              Masukkan alamat email Anda. Kami akan mengirimkan tautan untuk mereset password Anda.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Tautan Reset'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-black mb-2 text-foreground">Cek Email Anda</h1>
            <p className="text-muted-foreground text-sm mb-4">
              Kami telah mengirimkan tautan reset password ke <span className="font-bold text-foreground">{email}</span>. Silakan periksa kotak masuk atau folder spam Anda.
            </p>
            {previewUrl && (
              <a href={previewUrl} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold mb-4 hover:bg-blue-200 transition-colors">
                [Mode Development] Buka Email Simulasi
              </a>
            )}
          </>
        )}

        <div className="mt-8 pt-6 border-t border-border">
          <Link href="/?auth=login" className="flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
