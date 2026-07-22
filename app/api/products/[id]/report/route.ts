import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Harus login untuk melapor' }, { status: 401 });
    }

    const { reason, details } = await req.json();
    if (!reason) {
      return NextResponse.json({ message: 'Alasan harus diisi' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });

    const productId = parseInt(resolvedParams.id, 10);
    
    // Cek apakah produk ada
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ message: 'Produk tidak ditemukan' }, { status: 404 });

    // Jangan lapor diri sendiri
    if (product.userId === user.id) {
      return NextResponse.json({ message: 'Tidak bisa melaporkan produk sendiri' }, { status: 400 });
    }

    // Cek apakah sudah lapor sebelumnya
    const existing = await prisma.report.findFirst({
      where: { productId, reporterId: user.id }
    });

    if (existing) {
      return NextResponse.json({ message: 'Anda sudah melaporkan produk ini sebelumnya' }, { status: 400 });
    }

    // Buat Laporan
    await prisma.report.create({
      data: {
        productId,
        reporterId: user.id,
        reason,
        details: details || '',
      }
    });

    return NextResponse.json({ success: true, message: 'Laporan berhasil dikirim' }, { status: 200 });
  } catch (error: any) {
    console.error('Report error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
