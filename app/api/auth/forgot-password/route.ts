import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: 'Email tidak boleh kosong' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return 200 anyway for security (prevent email enumeration)
      return NextResponse.json({ message: 'Jika email terdaftar, tautan reset telah dikirim.' }, { status: 200 });
    }

    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Delete existing token if any
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    });

    // Save token to DB
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt
      }
    });

    // Generate test SMTP service account from ethereal.email
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    const info = await transporter.sendMail({
      from: '"JUBAGI Admin" <noreply@jubagi.com>',
      to: email,
      subject: 'Reset Password Akun JUBAGI',
      html: `
        <div style="font-family: Arial, sans-serif; max-w-md mx-auto padding: 20px;">
          <h2>Reset Password</h2>
          <p>Halo, ${user.name || 'Pengguna JUBAGI'},</p>
          <p>Kami menerima permintaan untuk mereset password akun JUBAGI Anda. Jika Anda tidak memintanya, abaikan email ini.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">Reset Password Saya</a>
          <p style="font-size: 12px; color: #666;">Tautan ini akan kedaluwarsa dalam 1 jam.</p>
        </div>
      `,
    });

    // For Ethereal, we can log the URL to view the email
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    return NextResponse.json({ 
      message: 'Tautan reset berhasil dikirim.', 
      previewUrl: nodemailer.getTestMessageUrl(info) 
    }, { status: 200 });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
