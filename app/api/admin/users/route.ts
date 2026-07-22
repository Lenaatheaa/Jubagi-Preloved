import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

// GET all users
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { profile: true, _count: { select: { products: true, likes: true } } },
  });

  return NextResponse.json(users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.profile?.name || null,
    phone: u.profile?.phone || null,
    avatar: u.profile?.avatar || null,
    createdAt: u.createdAt,
    productCount: u._count.products,
    likeCount: u._count.likes,
  })));
}

// DELETE a user
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ message: 'ID diperlukan' }, { status: 400 });

  await prisma.user.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
