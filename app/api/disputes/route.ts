import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { transactionId, reason, evidenceUrl } = body;

  if (!transactionId || !reason) {
    return NextResponse.json({ message: 'Transaction ID dan Alasan wajib diisi' }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(transactionId) },
    });

    if (!transaction) return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });

    // Hanya pembeli yang bisa komplain
    if (transaction.buyerId !== user.id) {
      return NextResponse.json({ message: 'Forbidden: Hanya pembeli yang dapat mengajukan komplain' }, { status: 403 });
    }

    // Cek apakah status memungkinkan komplain (sedang dikirim)
    // Dalam MVP, asalkan statusnya belum review/selesai atau gagal, kita bolehkan
    if (transaction.status === 'review' || transaction.status === 'failed' || transaction.status === 'cancelled') {
      return NextResponse.json({ message: 'Transaksi ini tidak dapat dikomplain lagi' }, { status: 400 });
    }

    const dispute = await prisma.$transaction(async (tx) => {
      // Buat Dispute
      const newDispute = await tx.dispute.create({
        data: {
          transactionId: transaction.id,
          complainantId: user.id,
          reason,
          evidenceUrl,
          status: 'open'
        }
      });

      // Update status transaksi menjadi disputed
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: 'disputed' }
      });

      // Catat History
      await tx.orderStatusHistory.create({
        data: {
          transactionId: transaction.id,
          status: 'disputed',
          note: `Pembeli mengajukan komplain. Alasan: ${reason}`,
        },
      });

      return newDispute;
    });

    return NextResponse.json({ success: true, dispute });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // Ambil daftar dispute milik user ini (baik sebagai pembeli maupun penjual dari transaksi tersebut)
    const disputes = await prisma.dispute.findMany({
      where: {
        transaction: {
          OR: [
            { buyerId: user.id },
            { sellerId: user.id }
          ]
        }
      },
      include: {
        transaction: {
          include: {
            product: true
          }
        },
        complainant: {
          select: { profile: { select: { name: true } }, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formatting serialization
    const formatted = disputes.map(d => ({
      ...d,
      transaction: {
        ...d.transaction,
        totalPrice: d.transaction.totalPrice ? Number(d.transaction.totalPrice) : 0,
        adminFee: d.transaction.adminFee ? Number(d.transaction.adminFee) : 0,
        sellerNet: d.transaction.sellerNet ? Number(d.transaction.sellerNet) : 0,
        product: {
          ...d.transaction.product,
          price: d.transaction.product.price ? Number(d.transaction.product.price) : 0,
        }
      }
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
