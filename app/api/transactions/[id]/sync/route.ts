import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

async function syncTransactionStatus(transactionId: number, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    return { status: 404, data: { message: 'User tidak ditemukan' } };
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!transaction) {
    return { status: 404, data: { message: 'Transaksi tidak ditemukan' } };
  }

  // Hanya pembeli, penjual, atau admin yang boleh sinkronisasi
  const isAuthorized =
    transaction.buyerId === user.id ||
    transaction.sellerId === user.id ||
    user.role === 'admin';

  if (!isAuthorized) {
    return { status: 403, data: { message: 'Forbidden' } };
  }

  // Jika status sudah tidak pending (sudah success, processing, shipped, dll), kembalikan langsung
  if (transaction.status !== 'pending') {
    return {
      status: 200,
      data: {
        success: true,
        alreadyProcessed: true,
        status: transaction.status,
        message: `Transaksi sudah berstatus ${transaction.status}`,
      },
    };
  }

  const latestPayment = transaction.payments[0];
  const orderId = latestPayment?.midtransOrderId;

  if (!orderId) {
    return {
      status: 400,
      data: { message: 'Data Midtrans Order ID tidak ditemukan untuk transaksi ini' },
    };
  }

  const serverKey = (process.env.MIDTRANS_SERVER_KEY || '').trim();
  if (!serverKey) {
    return {
      status: 500,
      data: { message: 'Server Key Midtrans belum dikonfigurasi di server' },
    };
  }

  const isProduction =
    process.env.MIDTRANS_IS_PRODUCTION === 'true' ||
    (!serverKey.startsWith('SB-') && process.env.NODE_ENV === 'production');

  const midtransBaseUrl = isProduction
    ? 'https://api.midtrans.com'
    : 'https://api.sandbox.midtrans.com';

  const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

  try {
    const midtransRes = await fetch(`${midtransBaseUrl}/v2/${orderId}/status`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: authHeader,
      },
      cache: 'no-store',
    });

    if (!midtransRes.ok) {
      const errData = await midtransRes.json().catch(() => ({}));
      return {
        status: 200,
        data: {
          success: false,
          status: 'pending',
          message:
            errData.status_message ||
            'Transaksi belum tercatat di Midtrans atau masih dalam proses',
        },
      };
    }

    const midtransData = await midtransRes.json();
    const { transaction_status, fraud_status, payment_type } = midtransData;

    let newStatus = 'pending';
    let paymentStatus = 'pending';

    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        paymentStatus = 'challenge';
        newStatus = 'pending';
      } else {
        paymentStatus = 'success';
        newStatus = 'success';
      }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'success';
      newStatus = 'success';
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire'
    ) {
      paymentStatus = 'failed';
      newStatus = 'failed';
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending';
      newStatus = 'pending';
    }

    if (newStatus !== transaction.status) {
      await prisma.$transaction(async (tx) => {
        if (latestPayment) {
          await tx.payment.update({
            where: { id: latestPayment.id },
            data: {
              paymentStatus: paymentStatus,
              paymentMethod: payment_type || latestPayment.paymentMethod,
            },
          });
        }

        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: newStatus },
        });

        if (newStatus === 'success' && transaction.productId) {
          await tx.product.update({
            where: { id: transaction.productId },
            data: { status: 'sold' },
          });
        }
      });

      try {
        await prisma.orderStatusHistory.create({
          data: {
            transactionId: transaction.id,
            status: newStatus,
            note: `Status disinkronkan langsung dari Midtrans API: ${transaction_status}`,
          },
        });
      } catch (historyErr) {
        console.warn('Gagal mencatat orderStatusHistory (diabaikan):', historyErr);
      }

      if (newStatus === 'success') {
        try {
          const { sendEmail } = require('@/lib/email');
          const buyer = transaction.buyerId
            ? await prisma.user.findUnique({
                where: { id: transaction.buyerId },
                include: { profile: true },
              })
            : null;
          const seller = transaction.sellerId
            ? await prisma.user.findUnique({
                where: { id: transaction.sellerId },
                include: { profile: true },
              })
            : null;
          const product = transaction.productId
            ? await prisma.product.findUnique({ where: { id: transaction.productId } })
            : null;

          if (buyer?.email) {
            await sendEmail(
              buyer.email,
              `Pembayaran Berhasil: ${product?.title || 'Pesanan Anda'}`,
              `<p>Halo ${buyer.profile?.name || 'Pembeli'},</p><p>Pembayaran Anda untuk <strong>${product?.title || 'Pesanan Anda'}</strong> sebesar Rp ${transaction.totalPrice} telah berhasil terverifikasi.</p><p>Mohon tunggu penjual memproses pesanan Anda.</p>`
            );
          }
          if (seller?.email) {
            await sendEmail(
              seller.email,
              `Pesanan Baru Masuk: ${product?.title || 'Produk Anda'}`,
              `<p>Halo ${seller.profile?.name || 'Penjual'},</p><p>Hore! <strong>${product?.title || 'Produk Anda'}</strong> telah dibayar oleh pembeli. Segera proses dan kirimkan barangnya ya!</p>`
            );
          }
        } catch (mailErr) {
          console.error('Gagal mengirim email notifikasi:', mailErr);
        }
      }

      return {
        status: 200,
        data: {
          success: true,
          updated: true,
          status: newStatus,
          message:
            newStatus === 'success'
              ? 'Pembayaran berhasil diverifikasi!'
              : `Status transaksi diperbarui menjadi ${newStatus}`,
        },
      };
    }

    return {
      status: 200,
      data: {
        success: true,
        updated: false,
        status: transaction.status,
        message: 'Pembayaran masih menunggu penyelesaian dari pelanggan',
      },
    };
  } catch (error: any) {
    console.error('[Sync Transaction] Error:', error);
    return {
      status: 500,
      data: { message: error.message || 'Gagal memeriksa status ke Midtrans' },
    };
  }
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const transactionId = parseInt(id, 10);
  if (isNaN(transactionId)) {
    return NextResponse.json({ message: 'Invalid Transaction ID' }, { status: 400 });
  }

  const result = await syncTransactionStatus(transactionId, session.user.email);
  return NextResponse.json(result.data, { status: result.status });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const transactionId = parseInt(id, 10);
  if (isNaN(transactionId)) {
    return NextResponse.json({ message: 'Invalid Transaction ID' }, { status: 400 });
  }

  const result = await syncTransactionStatus(transactionId, session.user.email);
  return NextResponse.json(result.data, { status: result.status });
}
