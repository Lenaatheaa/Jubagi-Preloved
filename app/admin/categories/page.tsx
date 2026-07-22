'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(d => { setCategories(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) });
    const data = await res.json();
    if (data.id) { setCategories(prev => [...prev, data]); setNewName(''); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus kategori ini?')) return;
    await fetch('/api/admin/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Manajemen Kategori</h1>
        <p className="text-muted-foreground text-sm mt-1">Atur struktur kategori marketplace</p>
      </div>

      {/* Add form */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-sm font-bold text-foreground mb-4">Tambah Kategori Baru</h2>
        <div className="flex gap-3">
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nama kategori..."
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 px-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
          <button onClick={handleAdd} disabled={saving || !newName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Tambah
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="divide-y divide-white/5">
            {categories.length === 0 ? (
              <p className="px-6 py-12 text-center text-muted-foreground">Belum ada kategori</p>
            ) : (
              categories.map(c => (
                <div key={c.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted transition-colors">
                  <div>
                    <p className="font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {c.id}  {c._count?.products ?? 0} produk</p>
                  </div>
                  <button onClick={() => handleDelete(c.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
