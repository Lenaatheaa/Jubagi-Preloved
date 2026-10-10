import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  
  if (!isAdmin(session)) {
    return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { status, adminNote } = body; // status: 'resolved_refund' or 'resolved_release'

  if (!status || !['resolved_refund', 'resolved_release'].includes(status)) {
    return NextResponse.json({ message: 'Status tidak valid' }, { status: 400 });
  }

  try {
    const disputeId = parseInt(resolvedParams.id);
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { transaction: true }
    });

    if (!dispute) return NextResponse.json({ message: 'Dispute not found' }, { status: 404 });

    if (dispute.status !== 'open' && dispute.status !== 'reviewing') {
      return NextResponse.json({ message: 'Dispute ini sudah diselesaikan sebelumnya' }, { status: 400 });
    }

    const updatedDispute = await prisma.$transaction(async (tx) => {
      // 1. Update dispute status
      const updated = await tx.dispute.update({
        where: { id: dispute.id },
        data: { status }
      });

      // 2. Handle funds based on resolution
      if (status === 'resolved_release') {
        // Bebaskan dana ke PENJUAL (gunakan sellerNet agar admin fee dipotong)
        const amountToTransfer = Number(dispute.transaction.sellerNet ?? dispute.transaction.totalPrice ?? 0);
        if (dispute.transaction.sellerId && amountToTransfer > 0) {
          await tx.user.update({
            where: { id: dispute.transaction.sellerId },
            data: { balance: { increment: amountToTransfer } }
          });
        }
        // Update status transaksi menjadi selesai
        await tx.transaction.update({
          where: { id: dispute.transaction.id },
          data: { status: 'review' } // review = completed in this system
        });
        
        await tx.orderStatusHistory.create({
          data: {
            transactionId: dispute.transaction.id,
            status: 'review',
            note: `[ADMIN RESOLUTION] Komplain ditolak. Dana diteruskan ke penjual. ${adminNote || ''}`,
          },
        });
      } else if (status === 'resolved_refund') {
        // Kembalikan dana ke PEMBELI (masuk ke saldo JUBAGI pembeli untuk MVP)
        if (dispute.transaction.buyerId && dispute.transaction.totalPrice) {
          await tx.user.update({
            where: { id: dispute.transaction.buyerId },
            data: { balance: { increment: Number(dispute.transaction.totalPrice) } }
          });
        }
        // Update status transaksi menjadi refund
        await tx.transaction.update({
          where: { id: dispute.transaction.id },
          data: { status: 'cancelled' }
        });
        
        // Kembalikan status barang menjadi available
        if (dispute.transaction.productId) {
           await tx.product.update({
             where: { id: dispute.transaction.productId },
             data: { status: 'available' }
           });
        }

        await tx.orderStatusHistory.create({
          data: {
            transactionId: dispute.transaction.id,
            status: 'cancelled',
            note: `[ADMIN RESOLUTION] Komplain diterima. Dana dikembalikan ke saldo JUBAGI pembeli. ${adminNote || ''}`,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, dispute: updatedDispute });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
