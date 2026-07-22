import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

// GET all products
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get('type'); // 'jual' | 'hibah'

  const where: any = {};
  if (typeFilter) where.type = typeFilter;

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      images: { take: 1 },
      category: true,
      user: { include: { profile: true } },
    },
  });

  return NextResponse.json(products.map(p => ({
    id: p.id,
    title: p.title,
    type: p.type,
    condition: p.condition,
    price: p.price ? Number(p.price) : null,
    location: p.location,
    status: p.status,
    category: p.category?.name || 'Lainnya',
    image: p.images[0]?.imageUrl || null,
    sellerName: p.user?.profile?.name || p.user?.email?.split('@')[0] || 'Pengguna',
    sellerEmail: p.user?.email || '',
    createdAt: p.createdAt,
  })));
}

// DELETE a product
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ message: 'ID diperlukan' }, { status: 400 });

  await prisma.product.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
