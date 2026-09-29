import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      productId: transaction.productId,
      buyerId: transaction.buyerId,
      sellerId: transaction.sellerId,
      totalPrice: transaction.totalPrice ? Number(transaction.totalPrice) : 0,
      adminFee: transaction.adminFee ? Number(transaction.adminFee) : 0,
      sellerNet: transaction.sellerNet ? Number(transaction.sellerNet) : 0,
      feeType: transaction.feeType || 'buyer',
      status: transaction.status,
      createdAt: transaction.createdAt,
    })),
  });
}
