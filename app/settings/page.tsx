'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { User, Lock, Bell, Shield, Palette, Save, Loader2, Moon, Sun } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const TABS = [
  { id: 'profile', label: 'Edit Profil', icon: User },
  { id: 'password', label: 'Ubah Password', icon: Lock },
  { id: 'notifications', label: 'Notifikasi', icon: Bell },
  { id: 'privacy', label: 'Data & Privasi', icon: Shield },
  { id: 'theme', label: 'Tema', icon: Palette },
];

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privacyProfilePublic, setPrivacyProfilePublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMessage, setPwdMessage] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  // Theme State
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          if (data) {
            setName(data.name || '');
            setPhone(data.phone || '');
            setAddress(data.address || '');
            setAvatar(data.avatar || '');
            setNotificationsEnabled(data.notificationsEnabled ?? true);
            setPrivacyProfilePublic(data.privacyProfilePublic ?? true);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, address, avatar, notificationsEnabled, privacyProfilePublic }),
      });
      const data = await res.json();
      if (res.ok) {
        // Memperbarui session (cookie) secara langsung di client agar navbar berubah
        await update({ image: avatar });
        
        setMessage('Profil berhasil disimpan! Mengalihkan...');
        
        // Refresh cache Next.js agar server component memuat data profil terbaru
        router.refresh();
        
        // Pindah ke halaman profil setelah jeda 1 detik agar pengguna sempat membaca pesan
        setTimeout(() => {
          router.push('/profile');
        }, 1000);
      } else {
        setMessage(data.message || 'Gagal menyimpan profil.');
      }
    } catch (error) {
      setMessage('Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setAvatar(data.publicUrl);
    } catch (error) {
      console.error('Upload avatar error:', error);
      setMessage('Gagal mengunggah foto profil.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdSaving(true);
    setPwdMessage('');
    
    if (newPassword !== confirmPassword) {
      setPwdMessage('Konfirmasi password tidak cocok');
      setPwdSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwdMessage('Password berhasil diubah!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdMessage(data.message || 'Gagal mengubah password.');
      }
    } catch (error) {
      setPwdMessage('Terjadi kesalahan.');
    } finally {
      setPwdSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-muted dark:bg-[#0B0F19] pt-24 pb-20 transition-colors">
      <div className="max-w-5xl mx-auto px-4 lg:px-6">
        <h1 className="text-3xl font-black text-foreground dark:text-foreground mb-8">Pengaturan</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-card dark:bg-foreground rounded-2xl shadow-sm border border-border p-2 overflow-hidden flex flex-row md:flex-col overflow-x-auto transition-colors">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold rounded-xl transition-colors whitespace-nowrap ${
                      isActive ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-card'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-card dark:bg-foreground rounded-3xl shadow-sm border border-border p-6 md:p-8 transition-colors">
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-6">Informasi Profil</h2>
                  
                  {message && (
                    <div className={`p-4 rounded-xl mb-6 text-sm font-bold ${message.includes('berhasil') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {message}
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-foreground dark:text-muted-foreground mb-2">Nama Lengkap</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-card text-card-foreground dark:text-foreground"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground dark:text-muted-foreground mb-2">Foto Profil</label>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted overflow-hidden shrink-0 border border-border">
                          {avatar ? (
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 m-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleAvatarChange}
                            disabled={uploadingAvatar}
                            className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-card text-card-foreground dark:text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                          />
                          {uploadingAvatar && <p className="text-xs text-primary mt-1 font-bold animate-pulse">Mengunggah...</p>}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground dark:text-muted-foreground mb-2">Nomor Telepon <span className="text-red-500">* Wajib untuk pembeli</span></label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-card text-card-foreground dark:text-foreground"
                        placeholder="Contoh: 081234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground dark:text-muted-foreground mb-2">Alamat Pengiriman <span className="text-red-500">* Wajib untuk pembeli</span></label>
                      <textarea 
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                        rows={4}
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-card text-card-foreground dark:text-foreground resize-none"
                        placeholder="Masukkan alamat lengkap rumah/kantor untuk pengiriman barang"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={saving}
                      className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Simpan Profil
                    </button>
                  </form>
                </div>
              )}

              {activeTab === 'password' && (
                <div>
                  <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-6">Ubah Password</h2>
                  
                  {pwdMessage && (
                    <div className={`p-4 rounded-xl mb-6 text-sm font-bold ${pwdMessage.includes('berhasil') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {pwdMessage}
                    </div>
                  )}

                  <form onSubmit={handleSavePassword} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-foreground dark:text-muted-foreground mb-2">Password Saat Ini</label>
                      <input 
                        type="password" 
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-card text-card-foreground dark:text-foreground"
                        placeholder="Masukkan password saat ini"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground dark:text-muted-foreground mb-2">Password Baru</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-card text-card-foreground dark:text-foreground"
                        placeholder="Masukkan password baru (min. 6 karakter)"
                        minLength={6}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground dark:text-muted-foreground mb-2">Konfirmasi Password Baru</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full rounded-xl border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-card text-card-foreground dark:text-foreground"
                        placeholder="Ulangi password baru"
                        minLength={6}
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={pwdSaving}
                      className="w-full md:w-auto bg-foreground dark:bg-primary hover:bg-foreground/90 dark:hover:bg-primary/90 text-background dark:text-white font-bold px-8 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {pwdSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                      Ubah Password
                    </button>
                  </form>
                </div>
              )}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-6">Pengaturan Notifikasi</h2>
                  <div className="flex items-center justify-between p-4 bg-muted dark:bg-card rounded-xl border border-border dark:border-border">
                    <div>
                      <h4 className="font-bold text-foreground dark:text-foreground">Notifikasi Email</h4>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">Terima email untuk pesan baru dan penawaran</p>
                    </div>
                    <button 
                      onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${notificationsEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <div className={`absolute top-1 left-1 bg-card w-4 h-4 rounded-full transition-transform duration-300 ${notificationsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="mt-6 bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </div>
              )}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-6">Data & Privasi</h2>
                  <div className="flex items-center justify-between p-4 bg-muted dark:bg-card rounded-xl border border-border dark:border-border">
                    <div>
                      <h4 className="font-bold text-foreground dark:text-foreground">Profil Publik</h4>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">Izinkan orang lain melihat profil Anda</p>
                    </div>
                    <button 
                      onClick={() => setPrivacyProfilePublic(!privacyProfilePublic)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${privacyProfilePublic ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <div className={`absolute top-1 left-1 bg-card w-4 h-4 rounded-full transition-transform duration-300 ${privacyProfilePublic ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="mt-6 bg-primary text-white font-bold px-6 py-2.5 rounded-xl text-sm"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </div>
              )}
              {activeTab === 'theme' && (
                <div>
                  <h2 className="text-xl font-bold text-foreground dark:text-foreground mb-6">Tema Aplikasi</h2>
                  <div className="flex items-center justify-between p-4 bg-muted dark:bg-card rounded-xl border border-border dark:border-border">
                    <div>
                      <h4 className="font-bold text-foreground dark:text-foreground flex items-center gap-2">
                        {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-orange-400" />}
                        Mode Gelap (Dark Mode)
                      </h4>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-1">Ubah tampilan aplikasi menjadi gelap agar nyaman di mata</p>
                    </div>
                    {mounted && (
                      <button 
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 shadow-inner ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 left-1 bg-card w-5 h-5 rounded-full transition-transform duration-300 shadow flex items-center justify-center ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}>
                          {theme === 'dark' ? <Moon className="w-3 h-3 text-indigo-600" /> : <Sun className="w-3 h-3 text-muted-foreground" />}
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
