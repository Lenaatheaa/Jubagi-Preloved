import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Harus login untuk follow' }, { status: 401 });
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json({ message: 'Target user tidak valid' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });

    if (user.id === targetUserId) {
      return NextResponse.json({ message: 'Tidak bisa follow diri sendiri' }, { status: 400 });
    }

    // Cek apakah sudah follow
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId
        }
      }
    });

    if (existing) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existing.id }
      });
      return NextResponse.json({ following: false, message: 'Unfollowed' });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: user.id,
          followingId: targetUserId
        }
      });
      
      // Kirim Notifikasi Internal
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          title: 'Pengikut Baru',
          message: `${user.profile?.name || user.email.split('@')[0]} mulai mengikuti toko Anda!`,
          link: '/profile'
        }
      });

      return NextResponse.json({ following: true, message: 'Followed' });
    }
  } catch (error: any) {
    console.error('Follow error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
