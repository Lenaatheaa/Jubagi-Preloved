import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Ekstrak data dari notifikasi Midtrans
    const {
      order_id,
      transaction_status,
      status_code,
      gross_amount,
      signature_key,
    } = body;

    if (!order_id || !signature_key) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
    }

    // 2. Validasi Signature Key
    // signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const hash = crypto.createHash('sha512');
    hash.update(`${order_id}${status_code}${gross_amount}${serverKey}`);
    const generatedSignature = hash.digest('hex');

    if (generatedSignature !== signature_key) {
      console.warn('[Midtrans Webhook] Invalid signature key for order:', order_id);
      return NextResponse.json({ message: 'Invalid signature key' }, { status: 403 });
    }

    // 3. Ekstrak transactionId dari order_id
    // order_id format: JUBAGI-{transactionId}-{timestamp} ATAU HIBAH-{transactionId}
    const orderIdParts = order_id.split('-');
    if (orderIdParts.length < 2) {
      return NextResponse.json({ message: 'Unknown order_id format' }, { status: 400 });
    }
    
    const transactionIdStr = orderIdParts[1];
    const transactionId = parseInt(transactionIdStr, 10);

    if (isNaN(transactionId)) {
      return NextResponse.json({ message: 'Invalid transaction ID' }, { status: 400 });
    }

    // 4. Cari transaksi dan pembayaran di database
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        buyer: true,
        seller: true,
        product: true
      }
    });

    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    const payment = await prisma.payment.findFirst({
      where: { transactionId: transactionId, midtransOrderId: order_id },
    });

    // 5. Tentukan status baru berdasarkan transaction_status Midtrans
    let paymentStatus = 'pending';
    let transactionStatus = 'pending';
    let note = `Midtrans notification: ${transaction_status}`;

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      paymentStatus = 'success';
      transactionStatus = 'success';
      note = 'Pembayaran berhasil dikonfirmasi oleh Midtrans';
    } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
      paymentStatus = 'failed';
      transactionStatus = 'failed';
      note = `Pembayaran gagal atau kadaluarsa (${transaction_status})`;
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending';
      transactionStatus = 'pending';
      note = 'Menunggu pembayaran dari pelanggan';
    }

    // 6. Update database dalam transaction
    await prisma.$transaction(async (tx) => {
      // Update Payment jika ada
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { paymentStatus: paymentStatus },
        });
      } else {
        // Jika belum ada record payment (jarang terjadi karena kita buat sebelum Midtrans token), buat baru
        await tx.payment.create({
          data: {
            transactionId: transaction.id,
            midtransOrderId: order_id,
            paymentMethod: 'qris', // Default assumtion
            paymentStatus: paymentStatus,
            amount: BigInt(parseInt(gross_amount, 10) || 0),
          }
        });
      }

      // Update Transaction
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: transactionStatus },
      });

      // Catat di History
      await tx.orderStatusHistory.create({
        data: {
          transactionId: transaction.id,
          status: transactionStatus,
          note: note,
        },
      });

      // Jika sukses, ubah status produk menjadi 'sold'
      if (transactionStatus === 'success' && transaction.productId) {
        await tx.product.update({
          where: { id: transaction.productId },
          data: { status: 'sold' },
        });
      }
    });

    if (transactionStatus === 'success') {
      const { sendEmail } = require('@/lib/email');
      // Email ke pembeli
      await sendEmail(
        transaction.buyer.email,
        `Pembayaran Berhasil: ${transaction.product?.title}`,
        `<p>Halo ${transaction.buyer.name},</p><p>Pembayaran Anda untuk <strong>${transaction.product?.title}</strong> sebesar Rp ${transaction.totalPrice} telah berhasil.</p><p>Mohon tunggu penjual memproses pesanan Anda.</p>`
      );
      // Email ke penjual
      await sendEmail(
        transaction.seller.email,
        `Pesanan Baru Masuk: ${transaction.product?.title}`,
        `<p>Halo ${transaction.seller.name},</p><p>Hore! <strong>${transaction.product?.title}</strong> telah dibayar oleh pembeli. Segera proses dan kirimkan barangnya ya!</p>`
      );
    }

    console.log(`[Midtrans Webhook] Successfully processed order ${order_id} to status ${transactionStatus}`);
    return NextResponse.json({ message: 'OK' });
  } catch (error: any) {
    console.error('[Midtrans Webhook] Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
