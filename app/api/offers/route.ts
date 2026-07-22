import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { catchAsync } from '@/lib/api/apiHandler';
import { createOfferSchema } from '@/lib/schemas/offer.schema';

// POST /api/offers - Submit a price offer
export const POST = catchAsync(async (request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Validasi input dengan Zod
  const validation = createOfferSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({
      success: false,
      message: 'Validasi harga tawar gagal',
      errors: validation.error.format()
    }, { status: 400 });
  }

  const { productId, offerPrice } = validation.data;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });
  if (!user) return NextResponse.json({ message: 'User tidak ditemukan.' }, { status: 404 });

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) return NextResponse.json({ message: 'Produk tidak ditemukan.' }, { status: 404 });

  if (product.userId === user.id) {
    return NextResponse.json({ message: 'Kamu tidak bisa menawar barang milikmu sendiri.' }, { status: 400 });
  }

  if (product.price && offerPrice < (Number(product.price) * 0.5)) {
    return NextResponse.json({ message: `Tawaran minimal adalah 50% dari harga barang (Rp ${(Number(product.price) * 0.5).toLocaleString('id-ID')})` }, { status: 400 });
  }

  // 1. Save offer to MySQL
  const offer = await prisma.priceOffer.create({
    data: {
      productId: product.id,
      buyerId: user.id,
      offerPrice: BigInt(offerPrice),
      status: 'pending',
    },
  });

  // 2. Find or create Supabase chat room
  const sellerId = product.userId!;
  const { data: existingRooms } = await supabase
    .from('chat_rooms')
    .select('id')
    .or(`and(buyer_id.eq.${user.id},seller_id.eq.${sellerId}),and(buyer_id.eq.${sellerId},seller_id.eq.${user.id})`)
    .limit(1);

  let roomId = existingRooms?.[0]?.id;

  if (!roomId) {
    const seller = await prisma.user.findUnique({ where: { id: sellerId } });
    const { data: newRoom } = await supabase
      .from('chat_rooms')
      .insert({
        product_id: product.id,
        buyer_id: user.id,
        seller_id: sellerId,
        buyer_email: user.email,
        seller_email: seller?.email || '',
        product_title: product.title || 'Produk',
      })
      .select('id')
      .single();
    roomId = newRoom?.id;
  }

  // 3. Send offer as chat message
  if (roomId) {
    const displayName = user.profile?.name || user.email.split('@')[0];
    const formattedPrice = Number(offerPrice).toLocaleString('id-ID');
    await supabase.from('chat_messages').insert({
      room_id: roomId,
      sender_id: user.id,
      sender_name: displayName,
      sender_email: user.email,
      message: `[PRODUK:${product.id}:${product.title}]\n Penawaran Harga: Rp ${formattedPrice}`,
      message_type: 'offer',
      offer_amount: Number(offerPrice),
    });
  }

  return NextResponse.json({ success: true, offerId: offer.id, roomId });
});
