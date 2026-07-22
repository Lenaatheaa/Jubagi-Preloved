import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { amount, bankName, accountNumber, accountName } = await req.json();

    if (!amount || amount < 10000) {
      return NextResponse.json({ message: 'Minimal penarikan adalah Rp 10.000' }, { status: 400 });
    }

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json({ message: 'Data rekening tidak lengkap' }, { status: 400 });
    }

    // Ambil data user beserta balancenya
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (user.balance < amount) {
      return NextResponse.json({ message: 'Saldo tidak mencukupi' }, { status: 400 });
    }

    // Transaksi database: Kurangi saldo user, lalu buat record Withdrawal
    const withdrawal = await prisma.$transaction(async (tx) => {
      // MENCEGAH RACE CONDITION: Update HANYA JIKA saldo masih cukup di database
      const updatedUser = await tx.user.updateMany({
        where: { id: user.id, balance: { gte: amount } },
        data: {
          balance: { decrement: amount }
        }
      });

      // Jika count 0, artinya ada request bersamaan yang membuat saldo tidak cukup
      if (updatedUser.count === 0) {
        throw new Error('Saldo tidak mencukupi atau sedang diproses');
      }

      const newWithdrawal = await tx.withdrawal.create({
        data: {
          userId: user.id,
          amount,
          bankName,
          accountNumber,
          accountName,
          status: 'pending' // Admin akan mengubahnya menjadi approved/rejected
        }
      });

      return newWithdrawal;
    });

    return NextResponse.json({ success: true, withdrawal });
  } catch (error: any) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        withdrawals: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      balance: user.balance,
      withdrawals: user.withdrawals 
    });
  } catch (error: any) {
    return NextResponse.json({ message: 'Terjadi kesalahan internal server' }, { status: 500 });
  }
}
