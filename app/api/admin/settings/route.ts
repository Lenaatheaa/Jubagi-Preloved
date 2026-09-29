import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

function isAdmin(session: any) {
  return (session?.user as any)?.role === 'admin';
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const settings = await prisma.platformSetting.findMany();
    // Default config if not found
    let feeRateSetting = settings.find(s => s.key === 'PLATFORM_FEE_RATE');
    if (!feeRateSetting) {
      feeRateSetting = await prisma.platformSetting.create({
        data: {
          key: 'PLATFORM_FEE_RATE',
          value: '0.05',
          description: 'Persentase potongan biaya admin (0.05 = 5%)'
        }
      });
      settings.push(feeRateSetting);
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ message: 'Key and value are required' }, { status: 400 });
    }

    const updatedSetting = await prisma.platformSetting.upsert({
      where: { key },
      update: { value: value.toString() },
      create: { key, value: value.toString(), description: `Setting for ${key}` }
    });

    return NextResponse.json({ message: 'Pengaturan berhasil diperbarui', setting: updatedSetting });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
