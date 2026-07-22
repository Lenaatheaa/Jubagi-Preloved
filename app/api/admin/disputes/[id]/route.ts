import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { action } = await req.json(); // 'refund_buyer' or 'forward_seller'
    const transactionId = parseInt(resolvedParams.id, 10);

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction || transaction.status !== 'disputed') {
      return NextResponse.json({ message: 'Transaksi tidak valid' }, { status: 404 });
    }

    const buyer = transaction.buyerId ? await prisma.user.findUnique({ where: { id: transaction.buyerId } }) : null;
    const seller = transaction.sellerId ? await prisma.user.findUnique({ where: { id: transaction.sellerId } }) : null;

    const { sendEmail } = require('@/lib/email');

    await prisma.$transaction(async (tx) => {
      if (action === 'refund_buyer') {
        // Uang dikembalikan ke Pembeli
        await tx.transaction.update({
          where: { id: transactionId },
          data: { status: 'cancelled' } // Dibatalkan, refund manual/otomatis
        });
        
        // Asumsi: Jika refund, saldo dikembalikan ke wallet pembeli (karena midtrans tidak ada API refund otomatis di sini)
        await tx.user.update({
          where: { id: transaction.buyerId! },
          data: { balance: { increment: Number(transaction.totalPrice) } }
        });

        await tx.orderStatusHistory.create({
          data: { transactionId, status: 'cancelled', note: 'Komplain disetujui. Dana dikembalikan ke saldo pembeli.' }
        });
        
        if (buyer?.email) {
          await sendEmail(buyer.email, 'Keputusan Komplain: Dana Dikembalikan', `<p>Halo,</p><p>Berdasarkan tinjauan tim Admin JUBAGI, komplain Anda untuk transaksi TRX-00${transactionId} disetujui. Dana sebesar Rp ${transaction.totalPrice} telah dikembalikan ke saldo akun JUBAGI Anda.</p>`);
        }

      } else if (action === 'forward_seller') {
        // Penjual menang komplain, uang cair ke penjual
        await tx.transaction.update({
          where: { id: transactionId },
          data: { status: 'success' }
        });

        await tx.user.update({
          where: { id: transaction.sellerId! },
          data: { balance: { increment: Number(transaction.totalPrice) } }
        });

        await tx.orderStatusHistory.create({
          data: { transactionId, status: 'success', note: 'Komplain ditolak. Dana diteruskan ke penjual.' }
        });
        
        if (seller?.email) {
          await sendEmail(seller.email, 'Keputusan Komplain: Dana Diteruskan', `<p>Halo,</p><p>Berdasarkan tinjauan tim Admin JUBAGI, komplain pembeli untuk transaksi TRX-00${transactionId} ditolak. Dana sebesar Rp ${transaction.totalPrice} telah diteruskan ke saldo akun Anda.</p>`);
        }
      }
    });

    return NextResponse.json({ message: 'Resolusi komplain berhasil diproses', success: true });

  } catch (error) {
    console.error('Resolve dispute error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
