import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { catchAsync } from '@/lib/api/apiHandler';
import { z } from 'zod';

const acceptOfferSchema = z.object({
  messageId: z.number().optional(), // Supabase chat_message ID (to reference it)
  roomId: z.number(),
  offerAmount: z.number(),
  productId: z.number(),
});

export const POST = catchAsync(async (request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const validation = acceptOfferSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json({ message: 'Validasi gagal' }, { status: 400 });
  }

  const { roomId, offerAmount, productId } = validation.data;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  // 1. Verify that the product belongs to the current user (Seller)
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return NextResponse.json({ message: 'Produk tidak ditemukan' }, { status: 404 });
  }

  if (product.userId !== user.id) {
    return NextResponse.json({ message: 'Hanya penjual yang bisa menerima tawaran' }, { status: 403 });
  }

  // 2. Find the pending offer in MySQL
  // We look for a pending offer for this product with this amount
  const offer = await prisma.priceOffer.findFirst({
    where: {
      productId: product.id,
      offerPrice: BigInt(offerAmount),
      status: 'pending'
    },
    orderBy: { createdAt: 'desc' }
  });

  if (offer) {
    // Update offer status
    await prisma.priceOffer.update({
      where: { id: offer.id },
      data: { status: 'accepted' }
    });
  }

  // 3. Send confirmation message in Supabase Chat
  const displayName = user.profile?.name || user.email.split('@')[0];
  
  // Format link checkout with offerPrice
  const checkoutUrl = `/checkout/${product.id}?offerPrice=${offerAmount}`;
  
  await supabase.from('chat_messages').insert({
    room_id: roomId,
    sender_id: user.id,
    sender_name: displayName,
    sender_email: user.email,
    message: `[PRODUK:${product.id}:${product.title}]\nTawaran Rp ${offerAmount.toLocaleString('id-ID')} DITERIMA! \nSilakan klik tombol "Bayar Sekarang" di bawah untuk menyelesaikan pembayaran.`,
    message_type: 'text',
  });

  return NextResponse.json({
    success: true,
    message: 'Tawaran diterima',
    checkoutUrl
  });
});
