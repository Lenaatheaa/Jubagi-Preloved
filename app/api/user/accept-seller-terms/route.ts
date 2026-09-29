import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        isSellerAcceptedTerms: true,
        sellerAcceptedAt: new Date(),
      }
    });

    return NextResponse.json({ message: 'Ketentuan berhasil disetujui', success: true });
  } catch (error) {
    console.error('Error accepting seller terms:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
