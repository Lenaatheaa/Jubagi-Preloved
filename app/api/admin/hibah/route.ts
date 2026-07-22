import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const [hibahProducts, hibahRequests, transactions] = await Promise.all([
    prisma.product.findMany({
      where: { type: 'hibah' },
      orderBy: { createdAt: 'desc' },
      include: { images: { take: 1 }, user: { include: { profile: true } } },
    }),
    prisma.hibahRequest.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    hibahProducts: hibahProducts.map(p => ({
      id: p.id,
      title: p.title,
      image: p.images[0]?.imageUrl || null,
      sellerName: p.user?.profile?.name || p.user?.email?.split('@')[0] || 'Pengguna',
      createdAt: p.createdAt,
      status: p.status,
    })),
    hibahRequests: hibahRequests.map(r => ({
      id: r.id,
      productId: r.productId,
      requesterId: r.requesterId,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt,
    })),
    transactions: transactions.map(t => ({
      id: t.id,
      productId: t.productId,
      buyerId: t.buyerId,
      sellerId: t.sellerId,
      totalPrice: t.totalPrice ? Number(t.totalPrice) : null,
      status: t.status,
      createdAt: t.createdAt,
    })),
  });
}
