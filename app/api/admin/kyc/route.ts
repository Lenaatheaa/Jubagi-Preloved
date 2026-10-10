import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) {
    return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    // Ambil semua user yang pernah mengajukan verifikasi nomor telepon
    const users = await prisma.user.findMany({
      where: {
        profile: {
          kycStatus: { in: ['pending', 'verified', 'rejected'] }
        }
      },
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            name: true,
            phone: true,
            kycStatus: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
