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
      include: {
        product: { select: { id: true, title: true, type: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(disputedTransactions, { status: 200 });
  } catch (error) {
    console.error('Fetch disputes error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
