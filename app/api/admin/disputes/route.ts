import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const disputedTransactions = await prisma.transaction.findMany({
      where: {
        status: 'disputed'
      },
      orderBy: { createdAt: 'desc' },
    });

    const enrichedTransactions = await Promise.all(disputedTransactions.map(async (trx) => {
      const product = trx.productId ? await prisma.product.findUnique({ where: { id: trx.productId }, select: { id: true, title: true, type: true } }) : null;
      const buyer = trx.buyerId ? await prisma.user.findUnique({ where: { id: trx.buyerId }, select: { id: true, profile: { select: { name: true } }, email: true } }) : null;
      const seller = trx.sellerId ? await prisma.user.findUnique({ where: { id: trx.sellerId }, select: { id: true, profile: { select: { name: true } }, email: true } }) : null;
      const payments = await prisma.payment.findMany({ where: { transactionId: trx.id } });
      
      return {
        ...trx,
        product,
        buyer: buyer ? { id: buyer.id, name: buyer.profile?.name, email: buyer.email } : null,
        seller: seller ? { id: seller.id, name: seller.profile?.name, email: seller.email } : null,
        payment: payments[0] || null,
      };
    }));

    return NextResponse.json(enrichedTransactions, { status: 200 });
  } catch (error) {
    console.error('Fetch disputes error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
