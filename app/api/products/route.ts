import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { catchAsync } from '@/lib/api/apiHandler';
import { sanitizeObject } from '@/lib/api/sanitize';
import { createProductSchema } from '@/lib/schemas/product.schema';

const categoryMap: Record<string, number> = {
  'fashion': 1,
  'elektronik': 2,
  'kendaraan': 3,
  'properti': 4,
  'perabotan-rumah': 5,
  'hobi-koleksi': 6,
  'bayi-anak': 7,
  'kecantikan-kesehatan': 8,
  'hewan-peliharaan': 9,
  'jasa-lainnya': 10
};

export const GET = catchAsync(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const location = searchParams.get('location');
  const category = searchParams.get('category');
  const type = searchParams.get('type');
  const condition = searchParams.get('condition');

  // Pagination parameters
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');
  const hasPagination = !!(pageParam || limitParam);

  const page = parseInt(pageParam || '1', 10);
  const limit = parseInt(limitParam || '12', 10);
  const skip = (page - 1) * limit;

  const where: any = {
    // Filter soft-delete: sembunyikan produk yang sudah dihapus
    deletedAt: null,
    // Sembunyikan produk yang sudah terjual secara default
    status: { not: 'sold' },
  };
  
  if (q) {
    const searchTerms = q.split(' ').filter(term => term.trim().length > 0);
    if (searchTerms.length > 0) {
      where.AND = searchTerms.map(term => ({
        OR: [
          { title: { contains: term } },
          { description: { contains: term } },
        ]
      }));
    }
  }

  if (location && location !== 'Seluruh Indonesia') {
    where.location = location;
  }

  if (category) {
    const mappedId = categoryMap[category.toLowerCase()];
    if (mappedId) {
      where.categoryId = mappedId;
    } else if (!isNaN(Number(category))) {
      where.categoryId = Number(category);
    } else {
      where.category = {
        name: {
          contains: category,
        }
      };
    }
  }

  if (type) {
    where.type = type;
  }

  if (condition) {
    where.condition = condition;
  }

  const total = await prisma.product.count({ where });

  const products = await prisma.product.findMany({
    where,
    include: {
      images: true,
      category: true,
      boosts: {
        where: {
          status: 'active',
          activeUntil: { gt: new Date() }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    ...(hasPagination ? { skip, take: limit } : {}),
  });
  
  // Transform data to match frontend Product interface
  const formattedProducts = products.map((p: any) => ({
    id: p.id.toString(),
    type: p.type,
    condition: p.condition,
    category: p.category?.name || 'Lainnya',
    title: p.title,
    status: p.status,
    price: p.price ? Number(p.price) : 'Gratis',
    location: p.location || 'Indonesia',
    image: p.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    isBoosted: p.boosts && p.boosts.length > 0,
  }));

  // Sort boosted products to the top of the page
  formattedProducts.sort((a: any, b: any) => {
    if (a.isBoosted && !b.isBoosted) return -1;
    if (!a.isBoosted && b.isBoosted) return 1;
    return 0;
  });

  if (hasPagination) {
    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        total,
        page,
        limit,
        hasMore: skip + limit < total,
      }
    });
  }

  return NextResponse.json(formattedProducts);
});

export const POST = catchAsync(async (request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  
  // Validasi dengan Zod
  const validation = createProductSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({
      success: false,
      message: 'Validasi gagal',
      errors: validation.error.format()
    }, { status: 400 });
  }

  // Sanitasi data dari XSS injection
  const sanitized = sanitizeObject(validation.data);

  // Ambil userId dari session email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ message: 'User tidak ditemukan.' }, { status: 404 });

  // Cek mapping categoryId dari string ke number jika diperlukan
  let dbCategoryId: number | null = null;
  if (sanitized.categoryId) {
    if (typeof sanitized.categoryId === 'string') {
      dbCategoryId = categoryMap[sanitized.categoryId.toLowerCase()] || Number(sanitized.categoryId);
    } else {
      dbCategoryId = Number(sanitized.categoryId);
    }
    
    if (isNaN(dbCategoryId)) {
      dbCategoryId = null; // fallback if it cannot be parsed
    }
  }

  // Simpan product + images
  const product = await prisma.product.create({
    data: {
      userId: user.id,
      categoryId: dbCategoryId,
      title: sanitized.title,
      condition: sanitized.condition,
      type: sanitized.type,
      price: sanitized.price ? BigInt(sanitized.price) : null,
      description: sanitized.description || null,
      size: sanitized.size || null,
      brand: sanitized.brand || null,
      dealMethod: sanitized.dealMethod as any,
      location: sanitized.location || null,
      images: {
        create: sanitized.images ? sanitized.images.map((url: string) => ({ imageUrl: url })) : [],
      },
    },
  });

  return NextResponse.json({ success: true, productId: product.id });
});

