import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { destination, weight } = await req.json();

    // Simulasi delay jaringan (seolah-olah sedang memanggil API RajaOngkir asli)
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!destination || destination.trim().length < 3) {
       return NextResponse.json({ message: 'Alamat tujuan tidak valid' }, { status: 400 });
    }

    const isJawa = /jakarta|bogor|depok|tangerang|bekasi|bandung|semarang|surabaya|yogyakarta|banten|jawa/i.test(destination);
    
    // Base ongkir
    const baseReguler = isJawa ? 10000 : 25000;
    const baseExpress = isJawa ? 20000 : 40000;
    
    // Tambahan berat (per kg)
    const weightFactor = Math.ceil((weight || 1000) / 1000);
    const weightFee = (weightFactor - 1) * 5000;

    // Variasi ongkir berdasarkan teks alamat agar terlihat sangat dinamis seperti API asli
    const lengthModifier = (destination.length % 5) * 1000; 

    const rates = [
      { id: 'jne_reg', name: 'JNE Reguler', price: baseReguler + lengthModifier + weightFee, days: isJawa ? '2-3 hari' : '4-7 hari', courier: 'JNE' },
      { id: 'jnt_ez', name: 'J&T EZ', price: baseReguler + lengthModifier + 2000 + weightFee, days: isJawa ? '2-3 hari' : '3-5 hari', courier: 'J&T' },
      { id: 'sicepat_best', name: 'SiCepat BEST', price: baseExpress + lengthModifier + weightFee, days: isJawa ? '1 hari' : '1-2 hari', courier: 'SiCepat' },
      { id: 'pickup', name: 'Ambil Sendiri', price: 0, days: 'Sesuai kesepakatan', courier: 'Pickup' },
    ];

    return NextResponse.json({
      success: true,
      origin: 'Jakarta Selatan', // Asumsi toko di Jakarta
      destination: destination,
      weight: weight,
      results: rates
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ message: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
