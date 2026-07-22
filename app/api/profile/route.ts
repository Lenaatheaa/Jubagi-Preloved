import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';
import { catchAsync } from '@/lib/api/apiHandler';
import { sanitizeObject } from '@/lib/api/sanitize';
import { updateProfileSchema } from '@/lib/schemas/profile.schema';

export const GET = catchAsync(async (_req: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  return NextResponse.json({
    name: user.profile?.name || '',
    phone: user.profile?.phone || '',
    address: user.profile?.address || '',
    avatar: user.profile?.avatar || '',
    email: user.email,
    notificationsEnabled: user.profile?.notificationsEnabled ?? true,
    privacyProfilePublic: user.profile?.privacyProfilePublic ?? true,
  });
});

export const PUT = catchAsync(async (request: Request) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Validasi format profil dengan Zod
  const validation = updateProfileSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({
      success: false,
      message: 'Format profil tidak valid',
      errors: validation.error.format()
    }, { status: 400 });
  }

  // Sanitasi profil dari tag HTML berbahaya
  const sanitized = sanitizeObject(validation.data);
  const { name, phone, address, avatar, notificationsEnabled, privacyProfilePublic } = sanitized;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  try {
    const updatedProfile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: { 
        name, 
        phone, 
        address,
        avatar,
        notificationsEnabled: notificationsEnabled ?? true,
        privacyProfilePublic: privacyProfilePublic ?? true
      },
      create: {
        userId: user.id,
        name,
        phone,
        address,
        avatar,
        notificationsEnabled: notificationsEnabled ?? true,
        privacyProfilePublic: privacyProfilePublic ?? true
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Gagal memperbarui profil' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Profil berhasil diperbarui' });
});
