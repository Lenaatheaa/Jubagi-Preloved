import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const reports = await prisma.report.findMany({
      include: {
        product: { select: { id: true, title: true, type: true } },
        reporter: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reports, { status: 200 });
  } catch (error) {
    console.error('Fetch reports error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
