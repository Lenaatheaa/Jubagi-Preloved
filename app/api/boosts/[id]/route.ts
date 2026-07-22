import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  
  // Hanya admin yang bisa mengupdate status boost
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { status } = await req.json(); // 'active' | 'rejected'

    const boost = await prisma.productBoost.findUnique({
      where: { id: parseInt(resolvedParams.id) }
    });

    if (!boost) {
      return NextResponse.json({ message: 'Boost tidak ditemukan' }, { status: 404 });
    }

    if (boost.status !== 'pending_approval') {
      return NextResponse.json({ message: 'Status boost tidak dapat diubah' }, { status: 400 });
    }

    let activeUntil = null;
    if (status === 'active') {
      const now = new Date();
      now.setDate(now.getDate() + boost.durationDays);
      activeUntil = now;
    }

    const updated = await prisma.productBoost.update({
      where: { id: boost.id },
      data: {
        status,
        activeUntil,
      }
    });

    return NextResponse.json({ success: true, boost: updated });
  } catch (error: any) {
    console.error('[PATCH /api/boosts/[id]]', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
