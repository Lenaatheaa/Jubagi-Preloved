'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Token tidak valid atau tidak ditemukan.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok.');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal harus 8 karakter.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/?auth=login');
        }, 3000);
      } else {
        setError(data.message || 'Gagal mereset password.');
      }
    } catch (err) {
      setError('Terjadi kesalahan pada server.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-black mb-2 text-foreground">Tautan Tidak Valid</h1>
        <p className="text-muted-foreground text-sm mb-6">Tautan reset password tidak valid atau sudah kedaluwarsa.</p>
        <Link href="/forgot-password" className="text-primary hover:underline font-bold">Kirim ulang tautan</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-black mb-2 text-foreground">Berhasil!</h1>
        <p className="text-muted-foreground text-sm mb-6">Password Anda telah berhasil diperbarui. Anda akan diarahkan ke halaman login.</p>
        <Link href="/?auth=login" className="text-primary hover:underline font-bold">Klik di sini jika tidak diarahkan</Link>
      </div>
    );
  }

  return (
    <>
      <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-2xl font-black mb-2 text-foreground">Buat Password Baru</h1>
      <p className="text-muted-foreground text-sm mb-6">Silakan masukkan password baru Anda di bawah ini.</p>

      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-medium mb-4 text-left">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Password Baru</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              required
              className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">Konfirmasi Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              required
              className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 mt-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-3xl p-8 shadow-xl border border-border text-center">
        <Suspense fallback={<div className="py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
