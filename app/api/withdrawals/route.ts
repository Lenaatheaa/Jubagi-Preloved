import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(new URL('/?auth=login', req.url));
    }

    const formData = await req.formData();
    const amount = Number(formData.get('amount'));
    const bankName = formData.get('bankName') as string;
    const accountNumber = formData.get('accountNumber') as string;
    const accountName = formData.get('accountName') as string;

    if (!amount || amount < 10000 || !bankName || !accountNumber || !accountName) {
      return NextResponse.redirect(new URL('/dashboard/withdrawals?error=invalid_data', req.url));
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.balance < amount) {
      return NextResponse.redirect(new URL('/dashboard/withdrawals?error=insufficient_balance', req.url));
    }

    // Gunakan transaksi untuk memastikan konsistensi saldo
    await prisma.$transaction(async (tx) => {
      // 1. Kurangi saldo user
      await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: amount } }
      });

      // 2. Buat record withdrawal
      await tx.withdrawal.create({
        data: {
          userId: user.id,
          amount: amount,
          bankName,
          accountNumber,
          accountName,
          status: 'pending'
        }
      });
    });

    return NextResponse.redirect(new URL('/dashboard/withdrawals?success=true', req.url));

  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.redirect(new URL('/dashboard/withdrawals?error=server_error', req.url));
  }
}
