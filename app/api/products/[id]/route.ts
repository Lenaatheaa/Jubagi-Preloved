import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

// GET /api/products/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: Number(resolvedParams.id) },
      include: {
        images: true,
        user: { include: { profile: true } },
        category: true,
        likes: true,
      },
    });
    if (!product) return NextResponse.json({ message: 'Produk tidak ditemukan' }, { status: 404 });

    // Format response for frontend
    const session = await getServerSession(authOptions);
    let userId = null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email }});
      if (user) userId = user.id;
    }

    // Get real seller reviews
    // Get real seller reviews via Transaction
    const sellerReviews = await prisma.review.findMany({
      where: { 
        transaction: {
          sellerId: product.userId!
        }
      },
      select: { rating: true }
    });
    const sellerReviewCount = sellerReviews.length;
    const sellerRating = sellerReviewCount > 0
      ? (sellerReviews.reduce((acc, rev) => acc + (rev.rating || 0), 0) / sellerReviewCount).toFixed(1)
      : '0.0';

    const formatted = {
      id: product.id.toString(),
      title: product.title,
      description: product.description,
      price: product.price ? Number(product.price) : null,
      type: product.type,
      condition: product.condition,
      category: product.category?.name || 'Lainnya',
      location: product.location || 'Indonesia',
      dealMethod: product.dealMethod,
      size: product.size,
      brand: product.brand,
      status: product.status,
      images: product.images.map((img: any) => img.imageUrl).filter(Boolean),
      sellerId: product.userId,
      sellerName: product.user?.profile?.name || product.user?.email?.split('@')[0] || 'Pengguna JUBAGI',
      sellerEmail: product.user?.email || '',
      sellerAvatar: product.user?.profile?.avatar || null,
      sellerRating,
      sellerReviewCount,
      createdAt: product.createdAt,
      likeCount: product.likes.length,
      isLiked: userId ? product.likes.some((like: any) => like.userId === userId) : false,
    };

    return NextResponse.json(formatted);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

// PUT /api/products/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    const product = await prisma.product.findUnique({ where: { id: Number(resolvedParams.id) } });
    if (!product || product.userId !== user?.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    const updated = await prisma.product.update({
      where: { id: Number(resolvedParams.id) },
      data: {
        title: body.title,
        description: body.description,
        price: body.price ? BigInt(body.price) : null,
        condition: body.condition,
        size: body.size,
        brand: body.brand,
        dealMethod: body.dealMethod,
      },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    const product = await prisma.product.findUnique({ where: { id: Number(resolvedParams.id) } });
    if (!product || product.userId !== user?.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    await prisma.product.delete({ where: { id: Number(resolvedParams.id) } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
