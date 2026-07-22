import nodemailer from 'nodemailer';

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // Cek apakah user sudah mengonfigurasi SMTP di .env
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('--------------------------------------------------');
      console.log(' SISTEM MENSIMULASIKAN EMAIL (SMTP Belum Diatur)');
      console.log(` KE: ${to}`);
      console.log(` SUBJEK: ${subject}`);
      console.log(` KONTEN: ${html}`);
      console.log('--------------------------------------------------');
      return true;
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"JUBAGI" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email berhasil dikirim: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Gagal mengirim email:', error);
    return false;
  }
}
