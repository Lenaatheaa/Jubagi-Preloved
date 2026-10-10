import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

export async function PATCH(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  
  if (!isAdmin(session)) {
    return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const body = await req.json();
  const { kycStatus } = body; // 'verified' or 'rejected'

  if (!kycStatus || !['verified', 'rejected'].includes(kycStatus)) {
    return NextResponse.json({ message: 'Status KYC tidak valid' }, { status: 400 });
  }

  try {
    const userId = parseInt(resolvedParams.userId);
    const profile = await prisma.profile.findUnique({
      where: { userId: userId },
    });

    if (!profile) return NextResponse.json({ message: 'Profil not found' }, { status: 404 });

    const updatedProfile = await prisma.profile.update({
      where: { userId: userId },
      data: { kycStatus }
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
