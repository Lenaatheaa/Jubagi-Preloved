import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db as prisma } from '@/lib/db';
import { Gift, PackageOpen, CheckCircle, XCircle, Clock, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Manajemen Hibah - JUBAGI' };

export default async function HibahPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) redirect('/');

  // 1. Pengajuan Saya (sebagai peminat)
  const myRequestsRaw = await prisma.hibahRequest.findMany({
    where: { requesterId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  const myRequestsProducts = await prisma.product.findMany({
    where: { id: { in: myRequestsRaw.map(r => r.productId as number).filter(Boolean) } },
    include: { images: true, user: { select: { email: true } } }
  });

  const userTransactions = await prisma.transaction.findMany({
    where: { buyerId: user.id },
    select: { productId: true }
  });
  const checkedOutProductIds = new Set(userTransactions.map(t => t.productId));

  const myRequests = myRequestsRaw.map(req => ({
    ...req,
    product: myRequestsProducts.find(p => p.id === req.productId),
    hasCheckedOut: checkedOutProductIds.has(req.productId)
  }));

  // 2. Permintaan Masuk (sebagai pemilik barang hibah)
  const myHibahProducts = await prisma.product.findMany({
    where: { userId: user.id, type: 'hibah' },
    include: { images: true },
  });

  const myHibahProductIds = myHibahProducts.map(p => p.id);

  const incomingRequestsRaw = await prisma.hibahRequest.findMany({
    where: { productId: { in: myHibahProductIds } },
    orderBy: { createdAt: 'desc' },
  });

  const requesters = await prisma.user.findMany({
    where: { id: { in: incomingRequestsRaw.map(r => r.requesterId as number).filter(Boolean) } },
    select: { id: true, email: true },
  });

  const incomingRequests = incomingRequestsRaw.map(req => ({
    ...req,
    product: myHibahProducts.find(p => p.id === req.productId),
    requester: requesters.find(u => u.id === req.requesterId)
  }));

  return (
    <div className="min-h-screen bg-muted pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-4 lg:px-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Manajemen Hibah</h1>
            <p className="text-muted-foreground text-sm mt-1">Pantau status pengajuan dan berikan barang secara gratis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Kolom 1: Pengajuan Saya (Sebagai Penerima) */}
          <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
              <PackageOpen className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-foreground text-lg">Pengajuan Saya</h2>
            </div>
            
            {myRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Belum ada pengajuan hibah.</p>
                <Link href="/?q=hibah" className="text-primary font-bold text-sm mt-2 inline-block hover:underline">
                  Cari Barang Hibah
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map((req) => (
                  <div key={req.id} className="p-4 border border-border rounded-2xl hover:bg-muted transition-colors">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted shrink-0">
                        {req.product?.images?.[0]?.imageUrl ? (
                          <img src={req.product.images[0].imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Gift className="w-6 h-6" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${req.productId}`} className="font-bold text-foreground hover:text-primary truncate block">
                          {req.product?.title || 'Produk Dihapus'}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-1">Diajukan: {new Date(req.createdAt).toLocaleDateString('id-ID')}</p>
                        
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                          {req.status === 'pending' && <><Clock className="w-3 h-3 text-amber-500" /> Menunggu Persetujuan</>}
                          {req.status === 'approved' && <><CheckCircle className="w-3 h-3 text-green-500" /> Diterima</>}
                          {req.status === 'rejected' && <><XCircle className="w-3 h-3 text-red-500" /> Ditolak</>}
                        </div>

                        {req.status === 'approved' && !req.hasCheckedOut && (
                          <Link href={`/checkout/${req.productId}`} className="mt-3 block text-center w-full bg-foreground text-white text-xs font-bold py-2 rounded-xl hover:bg-card transition-colors">
                            Lanjut ke Pengiriman
                          </Link>
                        )}
                        {req.status === 'approved' && req.hasCheckedOut && (
                          <Link href="/transactions" className="mt-3 block text-center w-full bg-blue-50 text-blue-600 text-xs font-bold py-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                            Lihat di Pesanan Saya
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kolom 2: Permintaan Masuk (Sebagai Pemberi) */}
          <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
              <Gift className="w-5 h-5 text-green-500" />
              <h2 className="font-bold text-foreground text-lg">Permintaan Masuk</h2>
            </div>

            {incomingRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">Belum ada yang meminta barang hibahmu.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((req) => (
                  <div key={req.id} className="p-4 border border-border rounded-2xl hover:bg-muted transition-colors">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0">
                        {req.product?.images?.[0]?.imageUrl && (
                          <img src={req.product.images[0].imageUrl} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-foreground text-sm truncate">{req.product?.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Peminat: {req.requester?.email?.split('@')[0] || 'User'}</p>
                        
                        <div className="mt-2 bg-muted p-2.5 rounded-xl">
                          <p className="text-xs text-muted-foreground italic line-clamp-2">"{req.message}"</p>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Status: {req.status}
                          </span>
                          <Link href={`/products/${req.productId}`} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                            Tinjau <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
