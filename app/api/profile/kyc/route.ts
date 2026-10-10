import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({ 
      where: { email: session.user.email },
      include: { profile: true } 
    });

    if (!user || !user.profile) {
      return NextResponse.json({ message: 'Profil tidak ditemukan. Lengkapi profil Anda terlebih dahulu.' }, { status: 404 });
    }

    // Pastikan nomor telepon sudah diisi di profil
    if (!user.profile.phone) {
      return NextResponse.json({ message: 'Isi nomor telepon di profil Anda terlebih dahulu sebelum mengajukan verifikasi.' }, { status: 400 });
    }

    if ((user.profile as any).kycStatus === 'verified') {
      return NextResponse.json({ message: 'Nomor telepon Anda sudah terverifikasi.' }, { status: 400 });
    }

    if ((user.profile as any).kycStatus === 'pending') {
      return NextResponse.json({ message: 'Pengajuan verifikasi sedang diproses oleh Admin.' }, { status: 400 });
    }

    // Simpan snapshot nomor HP saat pengajuan & ubah kycStatus ke pending
    const updatedProfile = await prisma.profile.update({
      where: { userId: user.id },
      data: {
        kycStatus: 'pending',
        phoneSnapshot: user.profile.phone, // snapshot phone saat pengajuan
      } as any
    });

    return NextResponse.json({ success: true, message: 'Pengajuan verifikasi nomor telepon berhasil dikirim!' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Server error' }, { status: 500 });
  }
}
