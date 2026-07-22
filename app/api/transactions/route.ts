import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import midtransClient from 'midtrans-client';
import { catchAsync } from '@/lib/api/apiHandler';
import { transactionLimiter } from '@/lib/api/rateLimit';
import { createTransactionSchema } from '@/lib/schemas/transaction.schema';

//  GET: Ambil riwayat transaksi user yang sedang login 
export const GET = catchAsync(async (request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const role = url.searchParams.get('role') || 'buyer';

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) return NextResponse.json([], { status: 200 });

  // Ambil transaksi berdasarkan role (buyer atau seller)
  const transactions = await prisma.transaction.findMany({
    where: role === 'seller' ? { sellerId: user.id } : { buyerId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  // Ambil data produk untuk setiap transaksi
  const productIds = transactions
    .map(t => t.productId)
    .filter((id): id is number => id !== null);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      images: { take: 1 },
      user: { include: { profile: { select: { name: true } } } },
    },
  });

  const productMap = new Map(products.map(p => [p.id, p]));

  const formatted = transactions.map(t => {
    const product = t.productId ? productMap.get(t.productId) : null;
    const latestPayment = t.payments[0];

    return {
      id: t.id,
      status: t.status || 'pending',
      totalPrice: t.totalPrice ? Number(t.totalPrice) : 0,
      createdAt: t.createdAt,
      paymentMethod: latestPayment?.paymentMethod || null,
      paymentStatus: latestPayment?.paymentStatus || null,
      product: product
        ? {
            id: product.id,
            title: product.title || 'Produk Tidak Ditemukan',
            image: product.images[0]?.imageUrl || '',
            type: product.type,
            condition: product.condition,
            sellerName:
              product.user?.profile?.name ||
              product.user?.email?.split('@')[0] ||
              'Penjual JUBAGI',
          }
        : null,
    };
  });

  return NextResponse.json(formatted);
});

//  POST: Buat transaksi baru 
export const POST = catchAsync(async (request: Request) => {
  // Terapkan rate limiting
  const rateLimitResponse = transactionLimiter(request, 'create_transaction');
  if (rateLimitResponse) return rateLimitResponse;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Validasi input dengan Zod
  const validation = createTransactionSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({
      success: false,
      message: 'Validasi input transaksi gagal',
      errors: validation.error.format()
    }, { status: 400 });
  }

  const { productId, offerPrice, shippingMethod, paymentMethod } = validation.data;

  // 1. Get user dengan profile
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  // Validasi profil lengkap
  if (!user.profile?.phone || !user.profile?.address) {
    return NextResponse.json(
      { message: 'Profil tidak lengkap', missingProfile: true },
      { status: 400 }
    );
  }

  // 2. Get product
  const product = await prisma.product.findUnique({
    where: { id: parseInt(productId) },
  });

  if (!product) {
    return NextResponse.json({ message: 'Produk tidak ditemukan' }, { status: 404 });
  }

  const isHibah = product.type === 'hibah';
  const finalPrice = isHibah ? 0 : (offerPrice ? Number(offerPrice) : Number(product.price ?? 0));

  // 3. Buat transaksi di database
  const transaction = await prisma.transaction.create({
    data: {
      productId: product.id,
      buyerId: user.id,
      sellerId: product.userId,
      totalPrice: BigInt(finalPrice),
      status: isHibah ? 'success' : 'pending',
    },
  });

  // Catat riwayat status (audit trail)  aman jika tabel belum ada
  try {
    await prisma.orderStatusHistory.create({
      data: {
        transactionId: transaction.id,
        status: transaction.status || 'pending',
        note: isHibah
          ? 'Transaksi hibah gratis berhasil dibuat dan disetujui otomatis'
          : 'Transaksi berhasil dibuat, menunggu pembayaran dari pembeli',
      },
    });
  } catch {
    console.warn('[Transactions] Gagal mencatat OrderStatusHistory  tabel mungkin belum di-migrate');
  }

  // 4. Jika hibah, langsung sukses tanpa pembayaran Midtrans
  if (isHibah) {
    await prisma.payment.create({
      data: {
        transactionId: transaction.id,
        midtransOrderId: `HIBAH-${transaction.id}`,
        paymentMethod: 'hibah',
        paymentStatus: 'success',
        amount: BigInt(0),
      },
    });
    return NextResponse.json({
      isHibah: true,
      transactionId: transaction.id,
      redirectUrl: `/checkout/${product.id}/success?id=${transaction.id}&hibah=1`,
    });
  }

  // 5. Init Midtrans untuk produk berbayar
  console.log('[Transactions] Initializing Midtrans (Forced Sandbox)...');
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
  
  const snap = new midtransClient.Snap({
    isProduction: false, // Force sandbox
    serverKey,
    clientKey,
  });

  const orderId = `JUBAGI-${transaction.id}-${Date.now()}`;
  console.log('[Transactions] Creating Snap parameter for order:', orderId);

  // 6. Create Snap parameters
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: finalPrice,
    },
    item_details: [
      {
        id: product.id.toString(),
        price: finalPrice,
        quantity: 1,
        name: product.title?.substring(0, 50) || 'Barang JUBAGI',
      },
    ],
    customer_details: {
      first_name: user.profile.name || user.email.split('@')[0],
      email: user.email,
      phone: user.profile.phone,
      billing_address: {
        first_name: user.profile.name || user.email.split('@')[0],
        email: user.email,
        phone: user.profile.phone,
        address: user.profile.address,
      },
    },
  };

  // Map JUBAGI paymentMethod to Midtrans enabled_payments
  let enabledPayments: string[] = [];
  switch (paymentMethod) {
    case 'qris': enabledPayments = ['other_qris', 'gopay', 'shopeepay']; break;
    case 'bca_va': enabledPayments = ['bca_va']; break;
    case 'bni_va': enabledPayments = ['bni_va']; break;
    case 'mandiri_va': enabledPayments = ['echannel']; break;
    case 'permata_va': enabledPayments = ['permata_va']; break;
    default: enabledPayments = ['other_qris'];
  }
  (parameter as any).enabled_payments = enabledPayments;

  // 7. Get Token dari Midtrans
  console.log('[Transactions] Calling snap.createTransaction()...');
  const snapResponse = await snap.createTransaction(parameter);
  console.log('[Transactions] Got Snap Response:', snapResponse);
  const snapToken = snapResponse.token;
  const redirectUrl = snapResponse.redirect_url;

  // 8. Catat payment record
  await prisma.payment.create({
    data: {
      transactionId: transaction.id,
      midtransOrderId: orderId,
      paymentMethod: paymentMethod,
      paymentStatus: 'pending',
      amount: BigInt(finalPrice),
    },
  });

  return NextResponse.json({
    token: snapToken,
    redirectUrl,
    transactionId: transaction.id,
    orderId,
  });
});
