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
  const { status } = body;

  if (!status) {
    return NextResponse.json({ message: 'Status is required' }, { status: 400 });
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

    // Validate if the user is the buyer or seller
    if (transaction.buyerId !== user.id && transaction.sellerId !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const updatedTransaction = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id: transaction.id },
        data: { status },
      });
      
      if (status === 'success') {
        // Update payment to success
        await tx.payment.updateMany({
          where: { transactionId: transaction.id },
          data: { paymentStatus: 'success' }
        });
        
        // Update product to sold if not hibah (hibah is already handled differently or can just be marked sold)
        if (transaction.productId) {
           await tx.product.update({
             where: { id: transaction.productId },
             data: { status: 'sold' }
           });
        }
      }

      if (status === 'review') {
        // Transaction completed (Pesanan Diterima), transfer money to seller's wallet
        if (transaction.sellerId && transaction.totalPrice) {
          await tx.user.update({
            where: { id: transaction.sellerId },
            data: {
              balance: {
                increment: Number(transaction.totalPrice)
              }
            }
          });
        }
      }

      return updated;
    });

    try {
      await prisma.orderStatusHistory.create({
        data: {
          transactionId: transaction.id,
          status: status,
          note: `Status diubah menjadi ${status}`,
        },
      });
    } catch {
      // Ignore if table not migrated
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
