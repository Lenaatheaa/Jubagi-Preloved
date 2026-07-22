import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;

  try {
    // Ambil data user beserta profil
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true },
    });

    if (!user) return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });

    // Ambil data produk beserta gambar, kategori, dan data penjual
    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
      include: {
        images: true,
        category: true,
        user: { include: { profile: true } },
      },
    });

    if (!product) return NextResponse.json({ message: 'Produk tidak ditemukan' }, { status: 404 });

    return NextResponse.json({
      user: {
        name: user.profile?.name || user.email.split('@')[0],
        phone: user.profile?.phone || '',
        address: user.profile?.address || '',
        email: user.email,
      },
      product: {
        id: product.id.toString(),
        title: product.title,
        type: product.type,
        condition: product.condition,
        price: product.price ? Number(product.price) : 0,
        isHibah: product.type === 'hibah',
        image: product.images?.[0]?.imageUrl || '',
        location: product.location || 'Indonesia',
        dealMethod: product.dealMethod,
        category: product.category?.name || 'Lainnya',
        sellerName: product.user?.profile?.name || product.user?.email?.split('@')[0] || 'Pengguna JUBAGI',
      },
    });
  } catch (error: any) {
    console.error('[GET /api/checkout]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
