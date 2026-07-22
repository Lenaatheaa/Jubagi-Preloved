import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

// POST /api/chat/messages
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { roomId, message, senderId, senderName, messageType = 'text', offerAmount } = await request.json();

    if (!roomId || !message || !senderId) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: senderId,
        sender_name: senderName || session.user.name || 'Pengguna',
        sender_email: session.user.email,
        message,
        message_type: messageType,
        offer_amount: offerAmount || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/chat/messages]', error);
      return NextResponse.json({ message: 'Gagal mengirim pesan' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data });
  } catch (error: any) {
    console.error('[POST /api/chat/messages]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/chat/messages?roomId=X
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ message: 'roomId diperlukan' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ message: 'Gagal mengambil pesan' }, { status: 500 });
  }

  return NextResponse.json({ messages: data || [] });
}
