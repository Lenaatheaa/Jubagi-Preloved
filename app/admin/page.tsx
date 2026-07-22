'use client';

import { useState, useEffect } from 'react';
import { Users, Package, ArrowLeftRight, Gift, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalTransactions: number;
  totalHibah: number;
  totalHibahRequests: number;
  totalTransactionRevenue: number;
  totalBoostRevenue: number;
  recentUsers: any[];
  recentTransactions: any[];
  chartData: any[];
}

function StatCard({ label, value, icon: Icon, color, sub, isCurrency }: any) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border hover:border-border transition-all group shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-3xl font-black text-foreground mb-1">
        {isCurrency ? `Rp ${value.toLocaleString('id-ID')}` : value.toLocaleString('id-ID')}
      </p>
      <p className="text-sm text-muted-foreground font-medium">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

import { Banknote, Star, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState<'this_month' | 'this_year' | '5y'>('this_year');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/stats?timeframe=${timeframe}`)
      .then(async r => {
        const d = await r.json();
        if (!r.ok) {
          setError(d.message || `Error ${r.status}`);
        } else {
          setStats({
            ...d,
            recentUsers: d.recentUsers ?? [],
            recentTransactions: d.recentTransactions ?? [],
            chartData: d.chartData ?? [],
          });
        }
        setLoading(false);
      })
      .catch(() => { setError('Gagal memuat data. Periksa koneksi dan coba lagi.'); setLoading(false); });
  }, [timeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400">
        <AlertCircle className="w-6 h-6 shrink-0" /> {error || 'Data tidak tersedia'}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-foreground mb-1">Overview Sistem</h1>
        <p className="text-muted-foreground text-sm">Pantau kondisi marketplace JUBAGI secara real-time</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard label="Total Nilai Transaksi Selesai" value={stats.totalTransactionRevenue || 0} isCurrency icon={Banknote} color="bg-green-600" sub="GMV dari seluruh transaksi sukses" />
        <StatCard label="Pendapatan Jual Iklan (Boost)" value={stats.totalBoostRevenue || 0} isCurrency icon={Star} color="bg-amber-500" sub="Pemasukan dari penjual" />
        <StatCard label="Total Produk Terdaftar" value={stats.totalProducts} icon={Package} color="bg-primary" sub="Semua barang jual & hibah" />
        <StatCard label="Total Pengguna" value={stats.totalUsers} icon={Users} color="bg-blue-500" sub="Akun terdaftar" />
        <StatCard label="Total Transaksi Masuk" value={stats.totalTransactions} icon={ArrowLeftRight} color="bg-emerald-500" sub="Semua status (Pending - Selesai)" />
        <StatCard label="Barang Hibah" value={stats.totalHibah} icon={Gift} color="bg-orange-500" sub={`${stats.totalHibahRequests} pengajuan masuk`} />
      </div>

      {/* Chart Section */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Grafik Pendapatan Transaksi</h2>
          </div>
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-1.5 bg-muted border border-border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="this_month">Per Hari (Bulan Ini)</option>
            <option value="this_year">Per Bulan (Tahun Ini)</option>
            <option value="5y">Per Tahun (5 Tahun Terakhir)</option>
          </select>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }} 
                className="text-muted-foreground"
                tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                formatter={(value: any) => [`Rp ${Number(value || 0).toLocaleString('id-ID')}`, 'Pendapatan']}
                labelStyle={{ fontWeight: 'bold', color: '#111827' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground text-sm">Pengguna Terbaru</h2>
          </div>
          <div className="divide-y divide-white/5">
            {(stats.recentUsers ?? []).length === 0 ? (
              <p className="px-6 py-8 text-center text-muted-foreground text-sm">Belum ada pengguna</p>
            ) : (
              (stats.recentUsers ?? []).map((u: any) => (
                <div key={u.id} className="px-6 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-primary flex items-center justify-center text-foreground text-sm font-bold shrink-0">
                    {(u.profile?.name || u.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{u.profile?.name || '-'}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(u.createdAt).toLocaleDateString('id-ID')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-green-400" />
            <h2 className="font-bold text-foreground text-sm">Transaksi Terbaru</h2>
          </div>
          <div className="divide-y divide-white/5">
            {(stats.recentTransactions ?? []).length === 0 ? (
              <p className="px-6 py-8 text-center text-muted-foreground text-sm">Belum ada transaksi</p>
            ) : (
              (stats.recentTransactions ?? []).map((t: any) => (
                <div key={t.id} className="px-6 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Transaksi #{t.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.totalPrice ? `Rp ${Number(t.totalPrice).toLocaleString('id-ID')}` : 'Hibah'}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    t.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                    t.status === 'success' ? 'bg-green-500/20 text-green-400' :
                    'bg-muted0/20 text-muted-foreground'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
