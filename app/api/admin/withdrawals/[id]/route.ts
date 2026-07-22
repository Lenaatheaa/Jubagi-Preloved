import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status } = body; // 'approved' or 'rejected'

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: parseInt(id) }
    });

    if (!withdrawal) {
      return NextResponse.json({ message: 'Data penarikan tidak ditemukan' }, { status: 404 });
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ message: 'Penarikan sudah diproses sebelumnya' }, { status: 400 });
    }

    // Gunakan transaction untuk memastikan keamanan data
    const updated = await prisma.$transaction(async (tx) => {
      // Jika ditolak, kembalikan uangnya ke saldo user
      if (status === 'rejected') {
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: { balance: { increment: withdrawal.amount } }
        });
      }

      // Update status penarikan
      return await tx.withdrawal.update({
        where: { id: parseInt(id) },
        data: { status }
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
