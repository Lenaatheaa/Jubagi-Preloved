import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

const BOOST_PACKAGES = {
  3: 15000,
  7: 30000,
  30: 100000,
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId, durationDays } = await req.json();

    if (!productId || !durationDays || !BOOST_PACKAGES[durationDays as keyof typeof BOOST_PACKAGES]) {
      return NextResponse.json({ message: 'Paket tidak valid' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
    if (!product || product.userId !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Cek apakah sudah ada request boost yang pending/aktif
    const existing = await prisma.productBoost.findFirst({
      where: {
        productId: product.id,
        status: { in: ['pending_payment', 'pending_approval', 'active'] },
      }
    });

    if (existing) {
      return NextResponse.json({ message: 'Barang ini sudah memiliki iklan yang sedang berjalan atau diproses.' }, { status: 400 });
    }

    const price = BOOST_PACKAGES[durationDays as keyof typeof BOOST_PACKAGES];

    const boost = await prisma.productBoost.create({
      data: {
        productId: product.id,
        userId: user.id,
        durationDays,
        price,
        status: 'pending_approval', // Kita simulasikan langsung sukses bayar dan menunggu persetujuan admin
      }
    });

    return NextResponse.json({ success: true, boost });
  } catch (error: any) {
    console.error('[POST /api/boosts]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  
  if (user?.role === 'admin') {
    // Admin mengambil semua data boost
    const boosts = await prisma.productBoost.findMany({
      include: {
        product: { select: { title: true, images: true } },
        user: { select: { email: true, profile: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ boosts });
  } else {
    // User biasa mengambil histori boost miliknya
    const boosts = await prisma.productBoost.findMany({
      where: { userId: user?.id },
      include: {
        product: { select: { title: true, images: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ boosts });
  }
}
