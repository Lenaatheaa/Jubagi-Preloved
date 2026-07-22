import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json([], { status: 200 });

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json([], { status: 200 });

    const notifications: any[] = [];

    // 1. Produk milik user ini
    const myProducts = await prisma.product.findMany({
      where: { userId: user.id },
      select: { id: true, title: true },
    });
    const myProductIds = myProducts.map(p => p.id);

    // 2. Penawaran harga yang masuk
    if (myProductIds.length > 0) {
      const offers = await prisma.priceOffer.findMany({
        where: { productId: { in: myProductIds }, buyerId: { not: user.id } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      for (const offer of offers) {
        const product = myProducts.find(p => p.id === offer.productId);
        // Ambil nama buyer secara terpisah
        const buyerProfile = offer.buyerId 
          ? await prisma.profile.findFirst({ where: { userId: offer.buyerId } })
          : null;
        
        const buyerUser = offer.buyerId 
          ? await prisma.user.findUnique({ where: { id: offer.buyerId }, select: { email: true } })
          : null;
          
        const buyerName = buyerProfile?.name || buyerUser?.email?.split('@')[0] || 'Seseorang';

        // Coba cari room chat-nya di Supabase
        const { data: existingRoom } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('product_id', product?.id)
          .eq('buyer_id', offer.buyerId || 0)
          .eq('seller_id', user.id)
          .maybeSingle();

        notifications.push({
          id: `offer-${offer.id}`,
          type: 'offer',
          title: 'Penawaran Harga Masuk',
          body: `${buyerName} menawar Rp ${Number(offer.offerPrice).toLocaleString('id-ID')} untuk "${product?.title}"`,
          time: offer.createdAt,
          read: false,
          link: existingRoom ? `/chat?roomId=${existingRoom.id}` : '/chat',
        });
      }
    }

    // 3. Pengajuan hibah yang masuk
    if (myProductIds.length > 0) {
      const hibahReqs = await prisma.hibahRequest.findMany({
        where: { productId: { in: myProductIds } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      for (const req of hibahReqs) {
        const product = myProducts.find(p => p.id === req.productId);
        const rProfile = req.requesterId
          ? await prisma.profile.findFirst({ where: { userId: req.requesterId } })
          : null;
          
        const rUser = req.requesterId
          ? await prisma.user.findUnique({ where: { id: req.requesterId }, select: { email: true } })
          : null;
          
        const rName = rProfile?.name || rUser?.email?.split('@')[0] || 'Seseorang';

        notifications.push({
          id: `hibah-${req.id}`,
          type: 'hibah',
          title: 'Permintaan Hibah',
          body: `${rName} mengajukan permintaan untuk "${product?.title}"`,
          time: req.createdAt,
          read: false,
          link: `/products/${req.productId}`,
        });
      }
    }

    // 4. Pesan chat terbaru dari Supabase
    try {
      const { data: chatRooms } = await supabase
        .from('chat_rooms')
        .select('id, product_title, buyer_id, seller_id')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (chatRooms && chatRooms.length > 0) {
        for (const room of chatRooms) {
          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('id, message, message_type, sender_name, created_at')
            .eq('room_id', room.id)
            .neq('sender_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (lastMsg) {
            const senderName = lastMsg.sender_name || 'Seseorang';
            notifications.push({
              id: `chat-${lastMsg.id}`,
              type: 'chat',
              title: 'Pesan Baru',
              body: `${senderName}: ${lastMsg.message_type === 'offer' ? ' Menawar harga' : lastMsg.message}`,
              time: lastMsg.created_at,
              read: false,
              link: `/chat?roomId=${room.id}`,
            });
          }
        }
      }
    } catch {
      // Supabase optional  lanjut tanpa chat notifications
    }

    notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return NextResponse.json(notifications.slice(0, 20));
  } catch (e: any) {
    console.error('[GET /api/notifications]', e.message);
    return NextResponse.json([], { status: 200 });
  }
}
