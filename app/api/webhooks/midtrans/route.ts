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
    const serverKey = (process.env.MIDTRANS_SERVER_KEY || '').trim();
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
    });

    if (!transaction) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }

    const buyer = transaction.buyerId ? await prisma.user.findUnique({ where: { id: transaction.buyerId }, include: { profile: true } }) : null;
    const seller = transaction.sellerId ? await prisma.user.findUnique({ where: { id: transaction.sellerId }, include: { profile: true } }) : null;
    const product = transaction.productId ? await prisma.product.findUnique({ where: { id: transaction.productId } }) : null;

    let payment = await prisma.payment.findFirst({
      where: { transactionId: transactionId, midtransOrderId: order_id },
    });

    // Fallback: cari payment berdasarkan transactionId saja jika midtransOrderId berbeda
    if (!payment) {
      payment = await prisma.payment.findFirst({
        where: { transactionId: transactionId },
        orderBy: { createdAt: 'desc' },
      });
    }

    // 5. Tentukan status baru berdasarkan transaction_status & fraud_status Midtrans
    const fraudStatus = body.fraud_status;
    const paymentType = body.payment_type || payment?.paymentMethod || 'midtrans';

    let paymentStatus = 'pending';
    let transactionStatus = 'pending';
    let note = `Midtrans notification: ${transaction_status}`;

    if (transaction_status === 'capture') {
      if (fraudStatus === 'challenge') {
        paymentStatus = 'challenge';
        transactionStatus = 'pending';
        note = 'Pembayaran dalam peninjauan keamanan (Fraud Challenge)';
      } else {
        paymentStatus = 'success';
        transactionStatus = 'success';
        note = 'Pembayaran berhasil dikonfirmasi oleh Midtrans';
      }
    } else if (transaction_status === 'settlement') {
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

    // 6. Update database dalam transaction (Inti data pembayaran)
    await prisma.$transaction(async (tx) => {
      // Update Payment jika ada
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { 
            paymentStatus: paymentStatus,
            paymentMethod: paymentType,
            midtransOrderId: order_id,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            transactionId: transaction.id,
            midtransOrderId: order_id,
            paymentMethod: paymentType,
            paymentStatus: paymentStatus,
            amount: BigInt(parseInt(gross_amount, 10) || 0),
          }
        });
      }

      // Update Transaction status
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: transactionStatus },
      });

      // Jika sukses, ubah status produk menjadi 'sold'
      if (transactionStatus === 'success' && transaction.productId) {
        await tx.product.update({
          where: { id: transaction.productId },
          data: { status: 'sold' },
        });
      }
    });

    // 7. Catat audit history di luar transaksi utama agar tidak rollback jika tabel belum ada
    try {
      await prisma.orderStatusHistory.create({
        data: {
          transactionId: transaction.id,
          status: transactionStatus,
          note: note,
        },
      });
    } catch (e) {
      console.warn('[Midtrans Webhook] Gagal mencatat orderStatusHistory (diabaikan):', e);
    }

    // 8. Kirim notifikasi email secara asynchronous
    if (transactionStatus === 'success') {
      try {
        const { sendEmail } = require('@/lib/email');
        if (buyer?.email) {
          await sendEmail(
            buyer.email,
            `Pembayaran Berhasil: ${product?.title || 'Pesanan Anda'}`,
            `<p>Halo ${buyer.profile?.name || 'Pembeli'},</p><p>Pembayaran Anda untuk <strong>${product?.title || 'Pesanan Anda'}</strong> sebesar Rp ${transaction.totalPrice} telah berhasil.</p><p>Mohon tunggu penjual memproses pesanan Anda.</p>`
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
        console.error('[Midtrans Webhook] Gagal mengirim email notifikasi:', mailErr);
      }
    }

    console.log(`[Midtrans Webhook] Successfully processed order ${order_id} to status ${transactionStatus}`);
    return NextResponse.json({ message: 'OK' });
  } catch (error: any) {
    console.error('[Midtrans Webhook] Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
