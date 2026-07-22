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

  const cats = await prisma.category.findMany({
    orderBy: { id: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(cats);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { name } = await request.json();
  if (!name) return NextResponse.json({ message: 'Nama diperlukan' }, { status: 400 });

  const cat = await prisma.category.create({ data: { name } });
  return NextResponse.json(cat);
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const { id } = await request.json();
  await prisma.category.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
