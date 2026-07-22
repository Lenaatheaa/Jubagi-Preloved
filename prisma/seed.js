const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Daftar lokasi tersebar dari berbagai provinsi di Indonesia
const LOCATIONS = [
  'DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur',
  'Banten', 'Bali', 'Sumatera Utara', 'Sumatera Selatan', 'Sumatera Barat',
  'Kalimantan Barat', 'Kalimantan Selatan', 'Kalimantan Timur',
  'Sulawesi Selatan', 'Sulawesi Utara', 'Nusa Tenggara Barat',
  'Lampung', 'Riau', 'Kepulauan Riau', 'Aceh'
];

// Ambil lokasi secara bergilir supaya semua terpakai
function loc(index) {
  return LOCATIONS[index % LOCATIONS.length];
}

async function main() {
  console.log('Cleaning database...');
  try {
    // Menghapus data dependency terlebih dahulu untuk menghindari constraint violation
    await prisma.productImage.deleteMany();
    await prisma.productLike.deleteMany();
    await prisma.priceOffer.deleteMany();
    await prisma.hibahRequest.deleteMany();
    await prisma.review.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();
    console.log('Database cleaned successfully.');
  } catch (error) {
    console.warn('Warning during database clean:', error.message);
  }

  // 0. Buat Admin User
  console.log('Seeding admin user...');
  const adminPassword = await bcrypt.hash('punyakuasa', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin',
      password: adminPassword,
      role: 'admin',
      profile: {
        create: {
          name: 'Admin JUBAGI',
          phone: '000000000',
          address: 'Kantor JUBAGI',
        }
      }
    }
  });
  console.log('Admin user created successfully.');

  // 1. Buat Dummy User untuk Pemilik Produk
  console.log('Seeding dummy users...');
  const hashedPassword = await bcrypt.hash('password123', 10);
  const dummyUser = await prisma.user.create({
    data: {
      email: 'dummy@jubagi.com',
      password: hashedPassword,
      profile: {
        create: {
          name: 'Doni Darmawan',
          phone: '081234567890',
          address: 'Jalan Kaliurang KM 5, Sleman, DI Yogyakarta',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        }
      }
    }
  });

  const extraUsers = [];
  const extraUserData = [
    { name: 'Siti Rahmawati', email: 'siti@example.com', phone: '082134567801', address: 'Bandung, Jawa Barat' },
    { name: 'Budi Santoso', email: 'budi@example.com', phone: '082134567802', address: 'Surabaya, Jawa Timur' },
    { name: 'Haidar Aji', email: 'haidar@example.com', phone: '082134567803', address: 'Medan, Sumatera Utara' },
    { name: 'Rini Handayani', email: 'rini@example.com', phone: '082134567804', address: 'Makassar, Sulawesi Selatan' },
    { name: 'Aditya Pratama', email: 'aditya@example.com', phone: '082134567805', address: 'Denpasar, Bali' }
  ];

  for (const u of extraUserData) {
    const newUser = await prisma.user.create({
      data: {
        email: u.email,
        password: hashedPassword,
        profile: {
          create: {
            name: u.name,
            phone: u.phone,
            address: u.address,
            avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*1000000)}?auto=format&fit=crop&w=150&q=80`,
          }
        }
      }
    });
    extraUsers.push(newUser);
  }
  console.log(`Dummy user created: ${dummyUser.email} along with ${extraUsers.length} extra users.`);

  // 2. Buat Kategori Utama (1 s/d 10)
  console.log('Seeding categories...');
  const categoryNames = [
    'FASHION',               // ID 1
    'ELEKTRONIK',            // ID 2
    'KENDARAAN',             // ID 3
    'PROPERTI',              // ID 4
    'PERABOTAN RUMAH',       // ID 5
    'HOBI & KOLEKSI',        // ID 6
    'BAYI & ANAK',           // ID 7
    'KECANTIKAN & KESEHATAN',// ID 8
    'HEWAN PELIHARAAN',      // ID 9
    'JASA & LAINNYA'         // ID 10
  ];

  const categories = [];
  for (let i = 0; i < categoryNames.length; i++) {
    const cat = await prisma.category.create({
      data: {
        id: i + 1,
        name: categoryNames[i]
      }
    });
    categories.push(cat);
  }
  console.log(`Seeded ${categories.length} categories.`);

  // 3. Buat Data Dummy Produk (10 produk per Kategori)
  console.log('Seeding dummy products...');

  const dummyProductsData = [
    // === CATEGORY 1: FASHION ===
    {
      categoryId: 1, title: 'Hoodie H&M Grey Size M', condition: 'brand_new', type: 'jual', price: 180000,
      location: 'Sleman', brand: 'H&M', size: 'M', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
      description: 'Hoodie H&M original warna abu-abu. Kondisi baru, belum pernah dipakai sama sekali. Dijual karena kekecilan.'
    },
    {
      categoryId: 1, title: 'Sepatu Sneakers Nike Air Max', condition: 'like_new', type: 'jual', price: 850000,
      location: 'Bantul', brand: 'Nike', size: '42', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      description: 'Nike Air Max original. Baru dipakai 2 kali untuk jalan-jalan di mall. Mulus lengkap dengan kardus.'
    },
    {
      categoryId: 1, title: 'Jaket Denim Levis Original', condition: 'lightly_used', type: 'jual', price: 350000,
      location: 'Yogyakarta', brand: 'Levis', size: 'L', dealMethod: 'delivery',
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
      description: 'Jaket denim Levis original. Kondisi masih sangat tebal, warna biru klasik sedikit pudar natural.'
    },
    {
      categoryId: 1, title: 'Kaos Vintage Band Nirvana', condition: 'well_used', type: 'jual', price: 90000,
      location: 'Sleman', brand: 'Rock Merchandise', size: 'XL', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
      description: 'Kaos band Nirvana vintage sablonan pudar estetik. Bahan katun dingin nyaman dipakai.'
    },
    {
      categoryId: 1, title: 'Celana Chino Uniqlo Slim Fit', condition: 'lightly_used', type: 'jual', price: 150000,
      location: 'Yogyakarta', brand: 'Uniqlo', size: '32', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',
      description: 'Celana panjang Chino Uniqlo warna krem muda. Slim fit, kondisi tidak ada robek atau noda.'
    },
    {
      categoryId: 1, title: 'Tas Ransel Fjallraven Kanken', condition: 'like_new', type: 'jual', price: 400000,
      location: 'Sleman', brand: 'Fjallraven', size: 'Medium', dealMethod: 'delivery',
      image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80',
      description: 'Tas punggung Kanken warna hijau zaitun. Kondisi mulus, resleting lancar jaya.'
    },
    {
      categoryId: 1, title: 'Kemeja Alisan Lengan Panjang', condition: 'brand_new', type: 'jual', price: 120000,
      location: 'Bantul', brand: 'Alisan', size: '15.5', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e23?w=800&q=80',
      description: 'Kemeja kerja Alisan warna putih bersih. Masih ada tag harga dan segel plastik lengkap.'
    },
    {
      categoryId: 1, title: 'Blazer Wanita Zara Hitam', condition: 'lightly_used', type: 'jual', price: 275000,
      location: 'Yogyakarta', brand: 'Zara', size: 'S', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80',
      description: 'Blazer kantor Zara warna hitam. Model formal nan elegan, furing dalam mulus no cacat.'
    },
    {
      categoryId: 1, title: 'Sepatu Pantofel Kulit Brodo', condition: 'well_used', type: 'jual', price: 200000,
      location: 'Sleman', brand: 'Brodo', size: '41', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      description: 'Sepatu kulit pantofel Brodo warna coklat tua. Kulit asli, ada lipatan pemakaian normal.'
    },
    {
      categoryId: 1, title: 'Baju Anak Perempuan Lucu', condition: 'well_used', type: 'hibah', price: null,
      location: 'Sleman', brand: 'Carter', size: '2 Tahun', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600&q=80',
      description: 'Dress anak perempuan motif bunga. Dihibahkan secara gratis bagi yang membutuhkan.'
    },

    // === CATEGORY 2: ELEKTRONIK ===
    {
      categoryId: 2, title: 'iPhone 11 Pro 64GB Grey', condition: 'like_new', type: 'jual', price: 4800000,
      location: 'Yogyakarta', brand: 'Apple', size: '64GB', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
      description: 'iPhone 11 Pro 64GB Space Grey. Battery Health 82% original, Truetone ON, FaceID lancar. HP + Charger.'
    },
    {
      categoryId: 2, title: 'Monitor Gaming ASUS 24 Inch', condition: 'lightly_used', type: 'jual', price: 1250000,
      location: 'Sleman', brand: 'ASUS', size: '24 Inch', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d8aca?w=800&q=80',
      description: 'Monitor gaming ASUS VP249QGR. Refresh rate 144Hz, IPS panel. Dus book lengkap, no dead pixel.'
    },
    {
      categoryId: 2, title: 'Keyboard Mechanical Keychron K2', condition: 'like_new', type: 'jual', price: 950000,
      location: 'Sleman', brand: 'Keychron', size: '75%', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
      description: 'Keychron K2 V2 Gateron Brown Switch. RGB Backlight, aluminum frame. Koneksi Bluetooth & Kabel lancar.'
    },
    {
      categoryId: 2, title: 'Mouse Wireless Logitech MX Master 3', condition: 'lightly_used', type: 'jual', price: 1100000,
      location: 'Yogyakarta', brand: 'Logitech', size: 'Standard', dealMethod: 'delivery',
      image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&q=80',
      description: 'Mouse legendaris untuk produktivitas. Logitech MX Master 3. Baterai awet berbulan-bulan sekali charge.'
    },
    {
      categoryId: 2, title: 'TWS Anker Soundcore R50i', condition: 'brand_new', type: 'jual', price: 199000,
      location: 'Bantul', brand: 'Anker', size: 'TWS', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
      description: 'TWS Bass luar biasa Anker R50i. Masih segel plastik bnib original. Garansi resmi 18 bulan.'
    },
    {
      categoryId: 2, title: 'Smartwatch Xiaomi Mi Band 7', condition: 'well_used', type: 'jual', price: 250000,
      location: 'Sleman', brand: 'Xiaomi', size: 'One Size', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&q=80',
      description: 'Xiaomi Mi Smart Band 7. Baret halus pemakaian wajar di layar. Sensor detak jantung dan olahraga aktif.'
    },
    {
      categoryId: 2, title: 'Speaker Bluetooth JBL Go 3', condition: 'like_new', type: 'jual', price: 390000,
      location: 'Yogyakarta', brand: 'JBL', size: 'Mini', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80',
      description: 'JBL Go 3 warna merah. Suara kencang ngebass, waterproof. Kondisi fisik 98% sangat terawat.'
    },
    {
      categoryId: 2, title: 'iPad Air 4 64GB WiFi Only', condition: 'lightly_used', type: 'jual', price: 5800000,
      location: 'Sleman', brand: 'Apple', size: '64GB', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80',
      description: 'iPad Air Gen 4 Green color. Layar mulus dipasang tempered glass sejak hari pertama. Dusbook lengkap.'
    },
    {
      categoryId: 2, title: 'Headphone Sony WH-1000XM4', condition: 'like_new', type: 'jual', price: 2900000,
      location: 'Yogyakarta', brand: 'Sony', size: 'ANC Headphone', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      description: 'Sony WH1000XM4 Black. Peredam suara (ANC) terbaik. Pad busa kencang tidak kelupas, case lengkap.'
    },
    {
      categoryId: 2, title: 'Charger Laptop ASUS Original', condition: 'well_used', type: 'hibah', price: null,
      location: 'Bantul', brand: 'ASUS', size: '19V - 3.42A', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
      description: 'Dihibahkan adaptor/charger laptop ASUS kepala colokan bulat standar. Berfungsi normal 100%.'
    },

    // === CATEGORY 3: KENDARAAN ===
    {
      categoryId: 3, title: 'Helm KYT Kyoto Solid White', condition: 'lightly_used', type: 'jual', price: 320000,
      location: 'Sleman', brand: 'KYT', size: 'L', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800&q=80',
      description: 'Helm KYT Kyoto putih polos. Busa tebal wangi, kaca bening tidak banyak gores. Kunci pengait normal.'
    },
    {
      categoryId: 3, title: 'Sepeda Gunung Polygon Monarch 4', condition: 'well_used', type: 'jual', price: 1400000,
      location: 'Bantul', brand: 'Polygon', size: 'Dewasa', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80',
      description: 'Sepeda Polygon Monarch 4 MTB. Roda ukuran 26. Gigi operan Shimano lancar, lecet pemakaian luar wajar.'
    },
    {
      categoryId: 3, title: 'Sarung Tangan Motor Scoyco', condition: 'brand_new', type: 'jual', price: 950000,
      location: 'Yogyakarta', brand: 'Scoyco', size: 'XL', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
      description: 'Sarung tangan full finger pelindung keras. Merk Scoyco asli, cocok untuk touring luar kota.'
    },
    {
      categoryId: 3, title: 'Jas Hujan Axio Original Karet', condition: 'lightly_used', type: 'jual', price: 120000,
      location: 'Sleman', brand: 'Axio', size: 'L', dealMethod: 'delivery',
      image: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=600&q=80',
      description: 'Jas hujan setelan baju celana tebal karet Axio. Dijamin tidak tembus air meskipun hujan badai.'
    },
    {
      categoryId: 3, title: 'Kunci Gembok Cakram Motor Honda', condition: 'like_new', type: 'jual', price: 45000,
      location: 'Yogyakarta', brand: 'Astra Honda', size: 'Small', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
      description: 'Gembok disc brake cakram depan motor universal. Kokoh terbuat dari besi solid antirust.'
    },
    {
      categoryId: 3, title: 'Ban Luar Motor IRC Tubeless', condition: 'brand_new', type: 'jual', price: 180000,
      location: 'Sleman', brand: 'IRC', size: '90/90 Ring 14', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
      description: 'Ban tubeless motor matic IRC. Ukuran standar ban belakang Vario/Beat. Masih bersegel toko.'
    },
    {
      categoryId: 3, title: 'Oli Mesin Motul Scooter Expert', condition: 'brand_new', type: 'jual', price: 75000,
      location: 'Yogyakarta', brand: 'Motul', size: '0.8L', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1627038166649-b5fe1f08bc27?w=600&q=80',
      description: 'Oli mesin Motul Scooter Expert LE 10W-30 matic. Pembelian salah tipe di online store.'
    },
    {
      categoryId: 3, title: 'Holder HP Stang Motor Gub Pro', condition: 'like_new', type: 'jual', price: 65000,
      location: 'Bantul', brand: 'Gub Pro', size: 'Universal', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
      description: 'Holder handphone di stang motor bahan aluminium tebal tahan getaran. Sangat kuat menjepit HP.'
    },
    {
      categoryId: 3, title: 'Sepatu Motor Boots Touring', condition: 'well_used', type: 'jual', price: 250000,
      location: 'Sleman', brand: 'AP Boots', size: '43', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
      description: 'Sepatu motor bahan kulit tebal pelindung tumit. Ada goresan aspal pemakaian normal.'
    },
    {
      categoryId: 3, title: 'Cover Motor Bebek Waterproof', condition: 'well_used', type: 'hibah', price: null,
      location: 'Sleman', brand: 'Kobe', size: 'Bebek/Matic', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
      description: 'Selimut cover motor warna silver. Dihibahkan karena sudah tidak punya motor lagi. Ada sedikit sobek kecil di bawah.'
    },

    // === CATEGORY 4: PROPERTI ===
    {
      categoryId: 4, title: 'Kost Putri AC Sekitar UGM', condition: 'brand_new', type: 'jual', price: 1500000,
      location: 'Sleman', brand: 'Eksklusif', size: '3x4m', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      description: 'Sewa kamar kost putri fasilitas AC, Kamar Mandi Dalam, Kasur Springbed, Lemari. Dekat Fakultas Teknik UGM.'
    },
    {
      categoryId: 4, title: 'Kontrakan Rumah 2 Kamar Murah', condition: 'like_new', type: 'jual', price: 15000000,
      location: 'Sleman', brand: 'Minimalis', size: '60m2', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80',
      description: 'Dikontrakan rumah minimalis siap huni. 2 Kamar Tidur, 1 Kamar Mandi, Garasi Mobil, Dapur. Daerah Mlati Sleman.'
    },
    {
      categoryId: 4, title: 'Tanah Kavling Strategis Jakal', condition: 'brand_new', type: 'jual', price: 350000000,
      location: 'Sleman', brand: 'SHM Pekarangan', size: '120m2', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
      description: 'Jual tanah pekarangan datar SHM ready bangun rumah hunian. Jalan Kaliurang KM 10 masuk 200m saja.'
    },
    {
      categoryId: 4, title: 'Ruko Minimalis 2 Lantai Ringroad', condition: 'lightly_used', type: 'jual', price: 65000000,
      location: 'Yogyakarta', brand: 'Ruko', size: '150m2', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
      description: 'Sewa ruko strategis 2 lantai pinggir jalan raya Ringroad Utara. Sangat cocok untuk kantor atau usaha.'
    },
    {
      categoryId: 4, title: 'Sewa Apartemen Studio Mataram City', condition: 'like_new', type: 'jual', price: 3500000,
      location: 'Sleman', brand: 'Fully Furnished', size: '24m2', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      description: 'Sewa apartemen tipe studio lantai 12. Full perabotan TV, AC, kulkas, water heater, kolam renang gedung.'
    },
    {
      categoryId: 4, title: 'Paviliun Keluarga Dekat UNY', condition: 'well_used', type: 'jual', price: 2000000,
      location: 'Sleman', brand: 'Paviliun', size: '40m2', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
      description: 'Paviliun terpisah 1 kamar tidur, ruang tamu, dapur mandiri. Air sumur bersih lancar, lingkungan tenang.'
    },
    {
      categoryId: 4, title: 'Sewa Gudang Bersih Mlati Sleman', condition: 'lightly_used', type: 'jual', price: 80000000,
      location: 'Sleman', brand: 'Gudang', size: '400m2', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80',
      description: 'Sewa gudang industri akses truk container tronton masuk. Konstruksi baja kuat, lantai cor tebal.'
    },
    {
      categoryId: 4, title: 'Tanah Sawah Murah Bantul', condition: 'brand_new', type: 'jual', price: 120000000,
      location: 'Bantul', brand: 'Sawah Produktif', size: '500m2', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
      description: 'Tanah sawah produktif irigasi lancar subur sepanjang tahun. Dekat pemukiman warga Bantul.'
    },
    {
      categoryId: 4, title: 'Kios Pasar Stan Sleman Depok', condition: 'well_used', type: 'jual', price: 8000000,
      location: 'Sleman', brand: 'Pasar Stan', size: '3x3m', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
      description: 'Oper sewa kios usaha pasar stan tajem. Strategis berada di area basah dagang kuliner.'
    },
    {
      categoryId: 4, title: 'Kost Kosong Kamar Sederhana', condition: 'well_used', type: 'jual', price: 400000,
      location: 'Yogyakarta', brand: 'Ekonomis', size: '3x3m', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      description: 'Kost putra kosong murah meriah mandi luar. Air sumur jernih, lokasi dekat stasiun Lempuyangan.'
    },

    // === CATEGORY 5: PERABOTAN RUMAH ===
    {
      categoryId: 5, title: 'Sofa Minimalis 2 Seater Abu-abu', condition: 'like_new', type: 'jual', price: 850000,
      location: 'Sleman', brand: 'IKEA', size: '140cm', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
      description: 'Sofa IKEA Klippan minimalis warna abu-abu. Busa sangat empuk, sarung bisa dilepas cuci.'
    },
    {
      categoryId: 5, title: 'Meja Belajar Jati Belanda Kaki Besi', condition: 'lightly_used', type: 'jual', price: 350000,
      location: 'Yogyakarta', brand: 'Custom', size: '100x60cm', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&q=80',
      description: 'Meja kerja kayu pinus solid/jati belanda. Kaki besi kokoh dicat hitam powder coating.'
    },
    {
      categoryId: 5, title: 'Lemari Pakaian Plastik 4 Susun', condition: 'lightly_used', type: 'jual', price: 175000,
      location: 'Bantul', brand: 'Club', size: '4 Susun', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80',
      description: 'Lemari baju plastik tebal merek Club. Anti rayap, anti jamur, bongkar pasang mudah.'
    },
    {
      categoryId: 5, title: 'Rak Buku Dinding Kayu Gantung', condition: 'like_new', type: 'jual', price: 60000,
      location: 'Sleman', brand: 'Decor', size: '60cm', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
      description: 'Rak ambalan melayang gantung isi 3 pcs. Cocok untuk menaruh buku kecil dan tanaman hias.'
    },
    {
      categoryId: 5, title: 'Jemuran Baju Aluminium Jumbo', condition: 'well_used', type: 'jual', price: 150000,
      location: 'Yogyakarta', brand: 'Bina Karya', size: '180cm', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80',
      description: 'Jemuran baju bahan aluminium tebal tidak berkarat. Sayap jemuran bisa dilipat menghemat tempat.'
    },
    {
      categoryId: 5, title: 'Blender Philips HR2115 Berfungsi', condition: 'lightly_used', type: 'jual', price: 350000,
      location: 'Sleman', brand: 'Philips', size: '2 Liter', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1606144042871-26eb3e131720?w=800&q=80',
      description: 'Blender Philips gelas kaca 2 Liter. 5 tombol kecepatan aktif, pisau blender tajam mulus.'
    },
    {
      categoryId: 5, title: 'Rice Cooker Cosmos Harmond 1.8L', condition: 'well_used', type: 'jual', price: 180000,
      location: 'Bantul', brand: 'Cosmos', size: '1.8L', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80',
      description: 'Cosmos Magic Com 1.8L panci harmond antilengket. Berfungsi menghangatkan dan memasak nasi.'
    },
    {
      categoryId: 5, title: 'Kipas Angin Miyako Berdiri', condition: 'lightly_used', type: 'jual', price: 130000,
      location: 'Sleman', brand: 'Miyako', size: '16 Inch', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1570535316377-511ce20f66d4?w=800&q=80',
      description: 'Kipas angin Miyako stand fan. Angin super kencang tidak bising, putaran swing kiri-kanan lancar.'
    },
    {
      categoryId: 5, title: 'Lampu Belajar Arsitek Estetik', condition: 'like_new', type: 'jual', price: 80000,
      location: 'Yogyakarta', brand: 'Pixar Style', size: 'Standard', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80',
      description: 'Lampu meja arsitek bisa dijepit meja atau dudukan berdiri. Fitting lampu e27 standar.'
    },
    {
      categoryId: 5, title: 'Kasur Busa Single Size Mulus', condition: 'well_used', type: 'hibah', price: null,
      location: 'Sleman', brand: 'Inoac', size: '90x200cm', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80',
      description: 'Dihibahkan kasur busa Inoac tebal 15cm. Kasur masih kenyal tidak kempes, hanya sarung sedikit pudar.'
    },

    // === CATEGORY 6: HOBI & KOLEKSI ===
    {
      categoryId: 6, title: 'Buku Novel Bumi Manusia - Pramoedya', condition: 'lightly_used', type: 'jual', price: 65000,
      location: 'Sleman', brand: 'Lentera Dipantara', size: 'Buku Novel', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
      description: 'Buku mahakarya Pramoedya Ananta Toer Bumi Manusia. Kertas halaman bersih kekuningan natural antik.'
    },
    {
      categoryId: 6, title: 'Gitar Akustik Yamaha F310 Original', condition: 'lightly_used', type: 'jual', price: 950000,
      location: 'Yogyakarta', brand: 'Yamaha', size: 'Akustik', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1510915361894-faa8b63a62f4?w=800&q=80',
      description: 'Gitar akustik Yamaha F310. Kayu mulus tidak retak, senar ceper tidak capek ditekan jari.'
    },
    {
      categoryId: 6, title: 'Action Figure Iron Man Bandai SHF', condition: 'like_new', type: 'jual', price: 450000,
      location: 'Sleman', brand: 'Bandai', size: '1/12 scale', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
      description: 'SH Figuarts Iron Man Mark 50 Bandai original. Sendi seret kokoh, kelengkapan part lengkap dus mulus.'
    },
    {
      categoryId: 6, title: 'Kaset Pita Dewa 19 Pandawa Lima', condition: 'well_used', type: 'jual', price: 75000,
      location: 'Bantul', brand: 'Aquarius', size: 'Kaset Pita', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1535914254981-b5012eebbd15?w=600&q=80',
      description: 'Kaset pita Dewa 19 album Pandawa Lima (1997). Pita kaset mulus lolos tes putar di tape player.'
    },
    {
      categoryId: 6, title: 'Buku Komik Naruto Volume 1-10 Tamat', condition: 'well_used', type: 'jual', price: 100000,
      location: 'Sleman', brand: 'Elex Media', size: 'Komik Set', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
      description: 'Paket bundling komik Naruto volume 1 sampai 10. Halaman tidak ada yang robek atau lepas.'
    },
    {
      categoryId: 6, title: 'Piringan Hitam Vinyl Koes Plus', condition: 'well_used', type: 'jual', price: 350000,
      location: 'Yogyakarta', brand: 'Purnama Record', size: '12 Inch Vinyl', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&q=80',
      description: 'Lagu legendaris Koes Plus. Piringan hitam lawas mulus tidak banyak goresan pemutaran.'
    },
    {
      categoryId: 6, title: 'Board Game Catan Edisi Indonesia', condition: 'like_new', type: 'jual', price: 420000,
      location: 'Sleman', brand: 'Kosmos', size: 'Boardgame', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600&q=80',
      description: 'Boardgame Catan edisi resmi bahasa Indonesia. Kartu disleeve rapi, token lengkap tidak hilang.'
    },
    {
      categoryId: 6, title: 'Raket Bulutangkis Yonex Nanoray 70', condition: 'lightly_used', type: 'jual', price: 280000,
      location: 'Bantul', brand: 'Yonex', size: 'Sport', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1622279457486-640c4cb68f2c?w=800&q=80',
      description: 'Raket badminton Yonex Nanoray 70 Light original. Senar tarikan 24 lbs masih kencang siap smash.'
    },
    {
      categoryId: 6, title: 'Tas Kamera Backpacker Eiger Focus', condition: 'lightly_used', type: 'jual', price: 550000,
      location: 'Sleman', brand: 'Eiger', size: 'Backpack', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
      description: 'Tas punggung kamera Eiger Focus. Sekat busa pelindung tebal customable, ada raincover.'
    },
    {
      categoryId: 6, title: 'Buku Pelajaran UTBK SBMPTN Soshum', condition: 'well_used', type: 'hibah', price: null,
      location: 'Sleman', brand: 'Wangsit', size: 'Buku Tebal', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
      description: 'Dihibahkan paket buku soal UTBK Soshum tahun lalu. Semoga membantu adik tingkat lolos PTN.'
    },

    // === CATEGORY 7: BAYI & ANAK ===
    {
      categoryId: 7, title: 'Stroller Bayi Baby Does Slim fold', condition: 'lightly_used', type: 'jual', price: 650000,
      location: 'Sleman', brand: 'Baby Does', size: 'Cabin Size', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1533512963162-8e7c10b2ba1d?w=800&q=80',
      description: 'Kereta dorong stroller lipat praktis cabin size. Sangat cocok dibawa bepergian naik pesawat.'
    },
    {
      categoryId: 7, title: 'Mainan Lego Duplo Box Besar', condition: 'like_new', type: 'jual', price: 380000,
      location: 'Yogyakarta', brand: 'Lego Duplo', size: 'Large Box', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1596461404969-9ce20c718c6f?w=800&q=80',
      description: 'Lego Duplo kepingan besar aman untuk balita melatih motorik kasar dan imajinasi kreatif.'
    },
    {
      categoryId: 7, title: 'Baby Bouncer Fisher Price 3in1', condition: 'well_used', type: 'jual', price: 180000,
      location: 'Bantul', brand: 'Fisher Price', size: 'One Size', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&q=80',
      description: 'Kursi goyang bouncer bayi Fisher Price musik dan getaran. Berfungsi baik menenangkan bayi.'
    },
    {
      categoryId: 7, title: 'Tas Keperluan Bayi Dialogue Baby', condition: 'lightly_used', type: 'jual', price: 90000,
      location: 'Sleman', brand: 'Dialogue', size: 'Medium Bag', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80',
      description: 'Tas popok perlengkapan bayi keluar rumah. Saku depan luas, sekat termos susu aluminium foil.'
    },
    {
      categoryId: 7, title: 'Gendongan Bayi Hipseat Ergobaby', condition: 'lightly_used', type: 'jual', price: 450000,
      location: 'Yogyakarta', brand: 'Ergobaby', size: 'Adjustable', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1606144042871-26eb3e131720?w=800&q=80',
      description: 'Gendongan hipseat ergonomis merk Ergobaby original. Menopang beban anak tidak pegal di pundak.'
    },
    {
      categoryId: 7, title: 'Sterilizer Botol Susu IQ Baby', condition: 'well_used', type: 'jual', price: 150000,
      location: 'Sleman', brand: 'IQ Baby', size: 'Elektrik', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1608889476418-013333c10b28?w=600&q=80',
      description: 'Alat steril botol bayi uap elektrik muat 6 botol sekaligus. Berfungsi matang membunuh kuman.'
    },
    {
      categoryId: 7, title: 'Sepatu Bayi Prewalker Adidas', condition: 'like_new', type: 'jual', price: 120000,
      location: 'Yogyakarta', brand: 'Adidas Kids', size: '18 (Balita)', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
      description: 'Sepatu prewalker Adidas orisinil alas lembut. Sangat imut dipakai bayi belajar berdiri.'
    },
    {
      categoryId: 7, title: 'Buku Dongeng Anak Cerita Rakyat', condition: 'well_used', type: 'jual', price: 35000,
      location: 'Sleman', brand: 'Gramedia', size: 'Buku Dongeng', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
      description: 'Kumpulan cerita rakyat nusantara bergambar menarik. Sangat pas dibacakan sebelum tidur.'
    },
    {
      categoryId: 7, title: 'Mainan Kerincingan Kayu Kayu', condition: 'brand_new', type: 'jual', price: 50000,
      location: 'Sleman', brand: 'Locally Made', size: 'Small', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1596461404969-9ce20c718c6f?w=800&q=80',
      description: 'Mainan rattle kerincing kayu pinus halus tanpa pernis cat kimia. Sangat aman digigit bayi.'
    },
    {
      categoryId: 7, title: 'Botol Susu Pigeon Wide Neck 160ml', condition: 'well_used', type: 'hibah', price: null,
      location: 'Bantul', brand: 'Pigeon', size: '160ml', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1574920162043-b872853f8980?w=600&q=80',
      description: 'Dihibahkan botol susu kaca pigeon wide neck. Kondisi kaca jernih steril, dot silikon silakan ganti baru.'
    },

    // === CATEGORY 8: KECANTIKAN & KESEHATAN ===
    {
      categoryId: 8, title: 'Timbangan Badan Digital Camry', condition: 'like_new', type: 'jual', price: 85000,
      location: 'Sleman', brand: 'Camry', size: 'Digital', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&q=80',
      description: 'Timbangan berat badan kaca tempered digital Camry. Layar LCD presisi baterai koin awet.'
    },
    {
      categoryId: 8, title: 'Catokan Rambut Philips Original', condition: 'lightly_used', type: 'jual', price: 250000,
      location: 'Yogyakarta', brand: 'Philips', size: 'Standard', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1606144042871-26eb3e131720?w=800&q=80',
      description: 'Catok rambut Philips pelurus dengan lapisan keramik. Panas merata cepat tidak merusak rambut.'
    },
    {
      categoryId: 8, title: 'Hair Dryer Panasonic EH-ND11', condition: 'well_used', type: 'jual', price: 95000,
      location: 'Bantul', brand: 'Panasonic', size: 'EH-ND11', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=600&q=80',
      description: 'Alat pengering rambut Panasonic daya 400 watt hemat listrik. Berfungsi hembusan angin hangat lancar.'
    },
    {
      categoryId: 8, title: 'Alat Pijat Elektrik Cushion Terapi', condition: 'lightly_used', type: 'jual', price: 150000,
      location: 'Sleman', brand: 'Shiatsu', size: 'Car/Home', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1591343395082-e120087024b4?w=600&q=80',
      description: 'Bantal pijat elektrik infra merah memijat otot leher pundak pinggang pegal kaku setelah beraktivitas.'
    },
    {
      categoryId: 8, title: 'Tensimeter Digital Omron HEM-7120', condition: 'like_new', type: 'jual', price: 450000,
      location: 'Yogyakarta', brand: 'Omron', size: 'Digital', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
      description: 'Alat cek tekanan darah lengan atas Omron HEM-7120. Mulus no error, lengkap manset original.'
    },
    {
      categoryId: 8, title: 'Alat Cek Darah 3in1 EasyTouch', condition: 'well_used', type: 'jual', price: 180000,
      location: 'Sleman', brand: 'EasyTouch', size: '3 in 1', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&q=80',
      description: 'Alat cek Gula Darah, Asam Urat, Kolesterol Easy Touch GCU. Alat monitor kesehatan harian rumah.'
    },
    {
      categoryId: 8, title: 'Skincare Organizer Acrylic Tebal', condition: 'like_new', type: 'jual', price: 75000,
      location: 'Sleman', brand: 'Acrylic', size: 'Large', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
      description: 'Kotak rias tempat kosmetik lipstik laci akrilik bening tebal kokoh. Meja rias rapi seketika.'
    },
    {
      categoryId: 8, title: 'Cermin Make Up LED Portable USB', condition: 'like_new', type: 'jual', price: 60000,
      location: 'Yogyakarta', brand: 'LED Mirror', size: 'USB Charge', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=600&q=80',
      description: 'Kaca dandan ringlight LED lipat baterai rechargable usb. Terang pas untuk makeup traveling.'
    },
    {
      categoryId: 8, title: 'Diffuser Humidifier Aromaterapi', condition: 'lightly_used', type: 'jual', price: 110000,
      location: 'Sleman', brand: 'Taffware', size: '500ml', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1547483238-f400e65ccd56?w=800&q=80',
      description: 'Humidifier uap ultrasonik aroma diffuser motif kayu minimalis. Dilengkapi remote kontrol praktis.'
    },
    {
      categoryId: 8, title: 'Masker Sensi Duckbill 1 Box', condition: 'brand_new', type: 'hibah', price: null,
      location: 'Yogyakarta', brand: 'Sensi', size: 'Isi 50', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
      description: 'Dihibahkan gratis masker medis Sensi Duckbill isi penuh 1 box. Masih baru segel aman higienis.'
    },

    // === CATEGORY 9: HEWAN PELIHARAAN ===
    {
      categoryId: 9, title: 'Kandang Kucing Besi Lipat M', condition: 'lightly_used', type: 'jual', price: 150000,
      location: 'Sleman', brand: 'Sweet', size: '60x42x42cm', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
      description: 'Kandang besi lipat tebal warna hitam kucing kelinci anjing mini. Kokoh, lengkap alas tatakan plastik.'
    },
    {
      categoryId: 9, title: 'Tempat Makan Kucing Otomatis Dispenser', condition: 'like_new', type: 'jual', price: 90000,
      location: 'Yogyakarta', brand: 'Petkit', size: '1.5 Liter', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
      description: 'Wadah makan dan minum kucing gravity feed otomatis. Makanan turun sendiri jika mangkok kosong.'
    },
    {
      categoryId: 9, title: 'Pet Cargo Ransel Astronot Kucing', condition: 'lightly_used', type: 'jual', price: 110000,
      location: 'Bantul', brand: 'Pet Cargo', size: 'Ransel', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
      description: 'Tas ransel kapsul transparan jendela astronot pembawa kucing atau anjing ras kecil berpergian.'
    },
    {
      categoryId: 9, title: 'Scratch Post Mainan Kucing Cakar', condition: 'well_used', type: 'jual', price: 60000,
      location: 'Sleman', brand: 'Handmade', size: 'Tinggi 50cm', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1596461404969-9ce20c718c6f?w=800&q=80',
      description: 'Tiang garukan kucing lilitan tali rami kelapa. Cocok mengalihkan perhatian cakaran kucing dari sofa.'
    },
    {
      categoryId: 9, title: 'Sisir Bulu Hewan Pet Grooming', condition: 'like_new', type: 'jual', price: 35000,
      location: 'Yogyakarta', brand: 'Grooming', size: 'Slicker Brush', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&q=80',
      description: 'Sisir sikat pembersih bulu kucing rontok mati dengan tombol pendorong rontokan praktis.'
    },
    {
      categoryId: 9, title: 'Kalung Kucing Lonceng Tali Kulit', condition: 'brand_new', type: 'jual', price: 20000,
      location: 'Sleman', brand: 'Leather', size: 'Adjustable', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
      description: 'Kalung leher kucing lonceng kerincingan imut bahan imitasi kulit sintetis warna merah.'
    },
    {
      categoryId: 9, title: 'Litter Box Pasir Kucing Jumbo', condition: 'well_used', type: 'jual', price: 45000,
      location: 'Bantul', brand: 'Plastik', size: 'Jumbo', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
      description: 'Bak wadah pup pip kucing pasir jumbo warna abu-abu. Tidak ada pecah retak, dicuci bersih disinfektan.'
    },
    {
      categoryId: 9, title: 'Gunting Kuku Hewan Anjing Kucing', condition: 'like_new', type: 'jual', price: 25000,
      location: 'Sleman', brand: 'Nail Clipper', size: 'Stainless', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
      description: 'Gunting kuku hewan peliharaan tajam bahan stainless dengan batas pelindung kedalaman gunting.'
    },
    {
      categoryId: 9, title: 'Tempat Tidur Hewan Empuk Kasur Pet', condition: 'like_new', type: 'jual', price: 80000,
      location: 'Yogyakarta', brand: 'Pet Bed', size: 'Diameter 40cm', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1541599540903-216a46ca1ad0?w=600&q=80',
      description: 'Kasur tempat tidur kucing anjing bentuk bulat bahan boneka halus empuk nyaman tidur siang.'
    },
    {
      categoryId: 9, title: 'Makanan Kucing Royal Canin Kitten', condition: 'brand_new', type: 'hibah', price: null,
      location: 'Sleman', brand: 'Royal Canin', size: 'Sisa 400g', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
      description: 'Dihibahkan makanan anak kucing Royal Canin Kitten dry food sisa sekitar 400 gram kemasan repack rapi.'
    },

    // === CATEGORY 10: JASA & LAINNYA ===
    {
      categoryId: 10, title: 'Service AC Panggilan Sleman', condition: 'brand_new', type: 'jual', price: 75000,
      location: 'Sleman', brand: 'Teknisi AC', size: 'Per Unit', dealMethod: 'delivery',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
      description: 'Melayani jasa cuci AC bersih, tambah freon, perbaikan AC bocor air/tidak dingin panggilan Sleman Yogyakarta.'
    },
    {
      categoryId: 10, title: 'Pindahan Rumah Pickup L300', condition: 'brand_new', type: 'jual', price: 150000,
      location: 'Yogyakarta', brand: 'Jasa Angkut', size: 'Per Rute', dealMethod: 'delivery',
      image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80',
      description: 'Jasa angkut barang pindahan kos kontrakan area Jogja Sleman Bantul. Armada Colt L300 bak terbuka.'
    },
    {
      categoryId: 10, title: 'Desain Grafis Feed Instagram', condition: 'brand_new', type: 'jual', price: 50000,
      location: 'Sleman', brand: 'Desainer Feed', size: 'Per Desain', dealMethod: 'delivery',
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&q=80',
      description: 'Jasa pembuatan desain postingan instagram feed atau stories estetik menawan untuk bisnis online shop.'
    },
    {
      categoryId: 10, title: 'Ketik Dokumen & Tugas Kuliah', condition: 'brand_new', type: 'jual', price: 5000,
      location: 'Sleman', brand: 'Jasa Ketik', size: 'Per Lembar', dealMethod: 'delivery',
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80',
      description: 'Jasa pengetikan makalah, skripsi, tugas laporan rapi cepat. Word, Excel, Powerpoint siap bantu.'
    },
    {
      categoryId: 10, title: 'Instal Ulang Laptop Windows', condition: 'brand_new', type: 'jual', price: 80000,
      location: 'Yogyakarta', brand: 'Teknisi PC', size: 'Per Laptop', dealMethod: 'delivery',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
      description: 'Jasa instal ulang Windows 10/11 laptop komputer lengkap software office pdf browser driver siap pakai.'
    },
    {
      categoryId: 10, title: 'Cuci Sepatu Premium Sneakers', condition: 'brand_new', type: 'jual', price: 35000,
      location: 'Sleman', brand: 'Laundry Sepatu', size: 'Per Pasang', dealMethod: 'delivery',
      image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&q=80',
      description: 'Laundry cuci sepatu kets sneakers canvas kulit berkualitas. Bersih wangi pembunuh kuman dan jamur.'
    },
    {
      categoryId: 10, title: 'Pembuatan Website Portofolio', condition: 'brand_new', type: 'jual', price: 500000,
      location: 'Sleman', brand: 'Web Dev', size: 'Landing Page', dealMethod: 'delivery',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
      description: 'Jasa desain coding website portofolio cv pribadi, company profile bisnis minimalis modern responsive.'
    },
    {
      categoryId: 10, title: 'Kursus Gitar Privat Pemula', condition: 'brand_new', type: 'jual', price: 100000,
      location: 'Yogyakarta', brand: 'Gitaris', size: 'Per Sesi', dealMethod: 'both',
      image: 'https://images.unsplash.com/photo-1510915361894-faa8b63a62f4?w=800&q=80',
      description: 'Belajar gitar akustik mudah dari nol kunci dasar strumming fingerstyle privat dipandu telaten.'
    },
    {
      categoryId: 10, title: 'Bersih Kost Deep Cleaning', condition: 'brand_new', type: 'jual', price: 120000,
      location: 'Sleman', brand: 'Kost Clean', size: 'Kamar Mandi', dealMethod: 'delivery',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      description: 'Jasa membersihkan kamar kost menyeluruh kerak toilet kamar mandi bersih kinclong wangi bebas noda hitam.'
    },
    {
      categoryId: 10, title: 'Pakaian Bekas Layak Pakai Campuran', condition: 'well_used', type: 'hibah', price: null,
      location: 'Yogyakarta', brand: 'Campuran', size: '1 Plastik Besar', dealMethod: 'pickup',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80',
      description: 'Dihibahkan satu plastik penuh kaos celana layak pakai ukuran dewasa. Monggo bagi yang membutuhkan.'
    }
  ];

  let productIdx = 0;
  const createdProducts = [];
  
  console.log('Verifying images for dummy products (filtering out 404s)...');
  const validProductsData = [];
  // Cek per batch agar tidak kena rate limit
  for (let i = 0; i < dummyProductsData.length; i += 5) {
    const batch = dummyProductsData.slice(i, i + 5);
    const results = await Promise.all(batch.map(async (pData) => {
      try {
        if (!pData.image) return pData;
        const res = await fetch(pData.image, { method: 'HEAD' });
        if (res.ok) return pData;
        return null;
      } catch (e) {
        return null;
      }
    }));
    validProductsData.push(...results.filter(Boolean));
  }
  console.log(`Verified! ${validProductsData.length} products have working images.`);

  for (const productInfo of validProductsData) {
    const { categoryId, image, ...pData } = productInfo;
    const priceBigInt = pData.price ? BigInt(pData.price) : null;
    const locationName = pData.location || loc(productIdx);

    const product = await prisma.product.create({
      data: {
        userId: dummyUser.id,
        categoryId: categoryId,
        title: pData.title,
        condition: pData.condition,
        type: pData.type,
        price: priceBigInt,
        description: pData.description,
        size: pData.size,
        brand: pData.brand,
        dealMethod: pData.dealMethod,
        location: locationName,
        status: 'available',
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Randomize within last 30 days
        images: {
          create: [
            { imageUrl: image }
          ]
        }
      }
    });
    createdProducts.push(product);
    productIdx++;
  }

  console.log('Successfully seeded 100 products.');

  console.log('Seeding transactions...');
  const jualProducts = createdProducts.filter(p => p.type === 'jual');
  const hibahProducts = createdProducts.filter(p => p.type === 'hibah');

  if (jualProducts.length >= 3 && extraUsers.length >= 3) {
    await prisma.transaction.create({
      data: {
        productId: jualProducts[0].id,
        buyerId: extraUsers[0].id,
        sellerId: dummyUser.id,
        totalPrice: jualProducts[0].price,
        status: 'success',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      }
    });

    await prisma.transaction.create({
      data: {
        productId: jualProducts[1].id,
        buyerId: extraUsers[1].id,
        sellerId: dummyUser.id,
        totalPrice: jualProducts[1].price,
        status: 'pending',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      }
    });

    await prisma.transaction.create({
      data: {
        productId: jualProducts[2].id,
        buyerId: extraUsers[2].id,
        sellerId: dummyUser.id,
        totalPrice: jualProducts[2].price,
        status: 'failed',
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      }
    });
  }

  console.log('Seeding hibah requests...');
  if (hibahProducts.length >= 2 && extraUsers.length >= 5) {
    await prisma.hibahRequest.create({
      data: {
        productId: hibahProducts[0].id,
        requesterId: extraUsers[3].id,
        message: 'Mohon izin untuk meminta barang hibah ini untuk kebutuhan adik sekolah, terima kasih banyak sebelumnya.',
        status: 'pending',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      }
    });

    await prisma.hibahRequest.create({
      data: {
        productId: hibahProducts[1].id,
        requesterId: extraUsers[4].id,
        message: 'Saya sangat tertarik dengan barang ini untuk keperluan riset tugas kuliah saya di kampus.',
        status: 'approved',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      }
    });
  }
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
