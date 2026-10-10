import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { courier, shippingReceipt } = body;

  if (!courier || !shippingReceipt) {
    return NextResponse.json({ message: 'Kurir dan Nomor Resi wajib diisi' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(resolvedParams.id) },
    });

    if (!transaction) return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });

    // Hanya penjual yang boleh menginput resi
    if (transaction.sellerId !== user.id) {
      return NextResponse.json({ message: 'Forbidden: Hanya penjual yang dapat menginput resi' }, { status: 403 });
    }

    // Transaksi harus dalam status 'processing' (sudah diproses penjual, belum kirim resi)
    if (transaction.status !== 'processing') {
       return NextResponse.json({ message: 'Pesanan harus dalam status "Diproses" untuk menginput resi' }, { status: 400 });
    }

    const updatedTransaction = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: 'shipped',
          courier,
          shippingReceipt,
          shippedAt: new Date()
        },
      });
      
      return updated;
    });

    try {
      await prisma.orderStatusHistory.create({
        data: {
          transactionId: transaction.id,
          status: 'shipped',
          note: `Barang telah dikirim melalui kurir ${courier} dengan resi: ${shippingReceipt}`,
        },
      });
    } catch {
      // Ignore if table not migrated
    }

    return NextResponse.json({ success: true, data: updatedTransaction });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
