import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';

// GET /api/chat/rooms - ambil semua room milik user ini
// GET /api/chat/rooms?productId=X&sellerId=Y - cari atau buat room baru
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const sellerId = searchParams.get('sellerId');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  // Mode: create/find specific room
  if (productId && sellerId) {
    const sellerIdNum = parseInt(sellerId);
    if (user.id === sellerIdNum) {
      return NextResponse.json({ message: 'Tidak bisa chat dengan diri sendiri' }, { status: 400 });
    }

    // Get product info
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });
    const seller = await prisma.user.findUnique({
      where: { id: sellerIdNum },
      include: { profile: true },
    });

    // Upsert room in Supabase (1 room per user pair)
    const { data: existingRooms, error: fetchError } = await supabase
      .from('chat_rooms')
      .select('*')
      .or(`and(buyer_id.eq.${user.id},seller_id.eq.${sellerIdNum}),and(buyer_id.eq.${sellerIdNum},seller_id.eq.${user.id})`)
      .limit(1);

    const existing = existingRooms?.[0];

    if (fetchError) {
      console.error('[chat/rooms GET] fetch error:', fetchError);
      return NextResponse.json({ message: 'Gagal mengambil room' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ room: existing });
    }

    // Create new room
    const { data: newRoom, error: insertError } = await supabase
      .from('chat_rooms')
      .insert({
        product_id: parseInt(productId),
        buyer_id: user.id,
        seller_id: sellerIdNum,
        buyer_email: user.email,
        seller_email: seller?.email || '',
        product_title: product?.title || 'Produk',
      })
      .select()
      .single();

    if (insertError) {
      console.error('[chat/rooms GET] insert error:', insertError);
      return NextResponse.json({ message: 'Gagal membuat room' }, { status: 500 });
    }

    return NextResponse.json({ room: newRoom });
  }

  // Mode: ambil semua room milik user ini
  const { data: rooms, error } = await supabase
    .from('chat_rooms')
    .select('*')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[chat/rooms GET] rooms error:', error);
    return NextResponse.json({ message: 'Gagal mengambil percakapan' }, { status: 500 });
  }

  // Deduplicate agar 1 pasangan user hanya punya 1 room terbaru
  const uniqueRooms: any[] = [];
  const pairSet = new Set();
  
  for (const room of (rooms || [])) {
    const otherId = room.buyer_id === user.id ? room.seller_id : room.buyer_id;
    if (!pairSet.has(otherId)) {
      pairSet.add(otherId);
      uniqueRooms.push(room);
    }
  }

  return NextResponse.json({ rooms: uniqueRooms, currentUserId: user.id });
}
