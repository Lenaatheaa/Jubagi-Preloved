import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

// POST /api/hibah  user mengajukan permintaan hibah
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { productId, message } = await req.json();
  if (!productId || !message) {
    return NextResponse.json({ message: 'productId dan alasan wajib diisi' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user) return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });

    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });
    if (product?.userId === user.id) {
      return NextResponse.json({ message: 'Tidak bisa mengajukan hibah barang sendiri' }, { status: 400 });
    }

    const existing = await prisma.hibahRequest.findFirst({
      where: { productId: Number(productId), requesterId: user.id },
    });
    if (existing) {
      return NextResponse.json({ message: 'Kamu sudah mengajukan hibah untuk barang ini' }, { status: 400 });
    }

    const request = await prisma.hibahRequest.create({
      data: { productId: Number(productId), requesterId: user.id, message },
    });
    return NextResponse.json({ success: true, request });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

// GET /api/hibah?productId=X  owner lihat daftar request
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get('productId');
  if (!productId) return NextResponse.json([], { status: 200 });

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    const product = await prisma.product.findUnique({ where: { id: Number(productId) } });

    if (product?.userId !== user?.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const requests = await prisma.hibahRequest.findMany({
      where: { productId: Number(productId) },
      orderBy: { createdAt: 'desc' },
    });

    const requestsWithRequester = await Promise.all(requests.map(async (req) => {
      const requester = await prisma.user.findUnique({
        where: { id: req.requesterId! },
        include: { profile: true }
      });
      return { ...req, requester };
    }));

    return NextResponse.json(requestsWithRequester);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
