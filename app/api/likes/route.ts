import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/likes  ambil produk yang dilike oleh user ini
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user) return NextResponse.json([], { status: 200 });

    const likes = await prisma.productLike.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: { images: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const products = likes.map(l => {
      if (!l.product) return null;
      return {
        ...l.product,
        price: l.product.price ? Number(l.product.price) : null,
      };
    }).filter(Boolean);
    return NextResponse.json(products);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

// POST /api/likes  toggle like (tambah jika belum, hapus jika sudah)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { productId } = await req.json();
  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user) return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });

    const existing = await prisma.productLike.findFirst({
      where: { userId: user.id, productId: Number(productId) },
    });

    if (existing) {
      await prisma.productLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ liked: false });
    } else {
      await prisma.productLike.create({
        data: { userId: user.id, productId: Number(productId) },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
