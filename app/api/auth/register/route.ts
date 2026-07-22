import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone, address } = body;

    // Validasi data
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Nama, Email, dan Password wajib diisi' },
        { status: 400 }
      );
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email sudah terdaftar' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan ke database (Membuat User sekaligus Profile-nya)
    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        profile: {
          create: {
            name,
            phone: phone || null,
            address: address || null,
          },
        },
      },
    });

    return NextResponse.json(
      { message: 'Registrasi berhasil', user: { email: newUser.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saat registrasi:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
