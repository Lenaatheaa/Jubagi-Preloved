'use client';

import { useState, useEffect } from 'react';
import { Loader2, Trash2, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadProducts = (type = '') => {
    setLoading(true);
    fetch(`/api/admin/products${type ? `?type=${type}` : ''}`)
      .then(async r => {
        const d = await r.json();
        if (r.ok) setProducts(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { loadProducts(typeFilter); }, [typeFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin hapus produk ini?')) return;
    setDeletingId(id);
    await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setProducts(prev => prev.filter(p => p.id !== id));
    setDeletingId(null);
  };

  const filtered = products.filter(p => !search || (p.title || '').toLowerCase().includes(search.toLowerCase()) || p.sellerEmail.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Manajemen Produk</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} produk terdaftar</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-xl overflow-hidden border border-border">
            {[['', 'Semua'], ['jual', 'Jual'], ['hibah', 'Hibah']].map(([val, label]) => (
              <button key={val} onClick={() => setTypeFilter(val)}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${typeFilter === val ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Produk</th>
                  <th className="px-6 py-4 text-left">Tipe</th>
                  <th className="px-6 py-4 text-left">Harga</th>
                  <th className="px-6 py-4 text-left">Penjual</th>
                  <th className="px-6 py-4 text-left">Tanggal</th>
                  <th className="px-6 py-4 text-left">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-muted transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img src={p.image} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gray-700 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[180px]">{p.title || 'Tanpa Judul'}</p>
                          <p className="text-xs text-muted-foreground">{p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.type === 'hibah' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {p.type === 'hibah' ? ' Hibah' : ' Jual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">
                      {p.price ? `Rp ${p.price.toLocaleString('id-ID')}` : <span className="text-green-400">Gratis</span>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-muted-foreground text-xs">{p.sellerName}</p>
                      <p className="text-muted-foreground text-xs">{p.sellerEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(p.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/products/${p.id}`} className="px-3 py-1.5 bg-muted hover:bg-muted text-muted-foreground text-xs font-bold rounded-lg transition-colors">
                          Detail
                        </Link>
                        <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors">
                          {deletingId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Tidak ada produk ditemukan</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
