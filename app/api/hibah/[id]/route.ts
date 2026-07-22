import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

// PATCH /api/hibah/[id]  owner approve/reject request
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { status } = await req.json(); // 'approved' | 'rejected'

  try {
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email! },
      include: { profile: true }
    });
    const request = await prisma.hibahRequest.findUnique({
      where: { id: Number(resolvedParams.id) },
    });

    if (!request) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const product = await prisma.product.findUnique({
      where: { id: request.productId! }
    });

    if (!product || product.userId !== user?.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.hibahRequest.update({
      where: { id: Number(resolvedParams.id) },
      data: { status },
    });

    // Jika approved, reject semua request lain untuk produk yang sama
    if (status === 'approved') {
      await prisma.hibahRequest.updateMany({
        where: {
          productId: request.productId!,
          id: { not: Number(resolvedParams.id) },
        },
        data: { status: 'rejected' },
      });
      // Update status produk menjadi tidak tersedia
      await prisma.product.update({
        where: { id: request.productId! },
        data: { status: 'given' },
      });

      // Create or find ChatRoom
      let chatRoom = await prisma.chatRoom.findFirst({
        where: {
          productId: request.productId!,
          buyerId: request.requesterId!,
          sellerId: user.id
        }
      });

      if (!chatRoom) {
        chatRoom = await prisma.chatRoom.create({
          data: {
            productId: request.productId!,
            buyerId: request.requesterId!,
            sellerId: user.id
          }
        });
      }

      // Send automated message via Supabase
      const { supabase } = await import('@/lib/supabase');
      await supabase.from('chat_messages').insert({
        room_id: chatRoom.id,
        sender_id: user.id,
        sender_name: user.profile?.name || user.email.split('@')[0],
        sender_email: user.email,
        message: `[PRODUK:${product.id}:${product.title}]\nPengajuan Hibah DITERIMA! Checkout Sekarang`,
        message_type: 'text'
      });
    }

    return NextResponse.json({ success: true, updated });
  } catch (e: any) {
    return NextResponse.json({ message: e.message }, { status: 500 });
  }
}
