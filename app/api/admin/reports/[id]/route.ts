import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const { action } = await req.json(); // action: 'takedown' atau 'reject'
    const reportId = parseInt(resolvedParams.id, 10);

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { product: true },
    });

    if (!report) return NextResponse.json({ message: 'Report not found' }, { status: 404 });

    if (action === 'takedown') {
      // 1. Takedown product
      await prisma.product.update({
        where: { id: report.productId },
        data: { 
          status: 'banned',
          deletedAt: new Date()
        }
      });
      // 2. Resolve the report
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'resolved' }
      });
      return NextResponse.json({ message: 'Produk berhasil di-takedown', success: true });
    } else if (action === 'reject') {
      // Tolak laporan
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'rejected' }
      });
      return NextResponse.json({ message: 'Laporan ditolak', success: true });
    }

    return NextResponse.json({ message: 'Aksi tidak dikenali' }, { status: 400 });

  } catch (error) {
    console.error('Update report error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
