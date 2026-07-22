import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db as prisma } from '@/lib/db';
import { Wallet, Clock, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Tarik Saldo - JUBAGI' };

export default async function WithdrawalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      withdrawals: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!user) redirect('/');

  return (
    <div className="min-h-screen bg-muted pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 lg:px-6">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="w-10 h-10 bg-card rounded-full flex items-center justify-center border border-border shadow-sm hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground">Tarik Saldo</h1>
            <p className="text-muted-foreground text-sm">Kelola dan tarik saldo penjualan Anda ke rekening pribadi.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Form Tarik Saldo */}
          <div className="md:col-span-1">
            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase">Saldo Aktif</p>
                  <p className="text-xl font-black text-green-600">Rp {user.balance.toLocaleString('id-ID')}</p>
                </div>
              </div>

              {user.balance > 0 ? (
                <form action="/api/withdrawals" method="POST" className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Nominal Penarikan (Rp)</label>
                    <input 
                      type="number" 
                      name="amount" 
                      max={user.balance} 
                      min={10000} 
                      required 
                      defaultValue={user.balance}
                      className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Bank Tujuan</label>
                    <select name="bankName" required className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm">
                      <option value="BCA">BCA</option>
                      <option value="Mandiri">Mandiri</option>
                      <option value="BNI">BNI</option>
                      <option value="BRI">BRI</option>
                      <option value="Gopay">Gopay / E-Wallet</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Nomor Rekening / HP</label>
                    <input type="text" name="accountNumber" required className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Nama Pemilik Rekening</label>
                    <input type="text" name="accountName" required className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-foreground hover:bg-foreground/90 text-background font-bold rounded-xl text-sm transition-colors mt-2">
                    Ajukan Penarikan
                  </button>
                  <p className="text-[10px] text-muted-foreground text-center">Minimal penarikan Rp 10.000. Proses 1-2 hari kerja.</p>
                </form>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-sm font-bold text-amber-700 mb-1">Saldo Kosong</p>
                  <p className="text-xs text-amber-600">Anda belum memiliki saldo penjualan yang bisa ditarik.</p>
                </div>
              )}
            </div>
          </div>

          {/* Riwayat Penarikan */}
          <div className="md:col-span-2">
            <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
              <h2 className="text-lg font-black text-foreground mb-4">Riwayat Penarikan</h2>
              
              {user.withdrawals.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-border rounded-xl">
                  <p className="text-sm text-muted-foreground font-medium">Belum ada riwayat penarikan.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {user.withdrawals.map((w: any) => (
                    <div key={w.id} className="flex items-center justify-between p-4 bg-muted/50 border border-border rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          w.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                          w.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {w.status === 'pending' && <Clock className="w-5 h-5" />}
                          {w.status === 'completed' && <CheckCircle2 className="w-5 h-5" />}
                          {w.status === 'rejected' && <XCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">Tarik ke {w.bankName}</p>
                          <p className="text-xs text-muted-foreground">{w.accountNumber} ({w.accountName})</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(w.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-foreground">Rp {Number(w.amount).toLocaleString('id-ID')}</p>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${
                          w.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          w.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {w.status === 'pending' ? 'Diproses' : w.status === 'completed' ? 'Berhasil' : 'Ditolak'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
