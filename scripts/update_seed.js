const fs = require('fs');
let code = fs.readFileSync('prisma/seed.js', 'utf-8');

const imageMap = {
  // Fashion
  'Hoodie': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
  'Kemeja': 'https://images.unsplash.com/photo-1596755094514-f87e32f85e23?w=800&q=80',
  'Sepatu Sneakers': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
  'Jaket Denim': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
  'Kaos': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
  'Celana Chino': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',
  'Tas Ransel': 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80',
  'Dress': 'https://images.unsplash.com/photo-1566160925206-8b2b73abce5e?w=800&q=80',
  'Jam Tangan': 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80',

  // Elektronik
  'iPhone': 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80',
  'Laptop': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
  'MacBook': 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
  'Kamera': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
  'PS4': 'https://images.unsplash.com/photo-1606144042871-26eb3e131720?w=800&q=80',
  'Smart TV': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&q=80',
  'Headphone': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
  'Monitor': 'https://images.unsplash.com/photo-1527443224154-c4a3942d8aca?w=800&q=80',

  // Kendaraan
  'Sepeda': 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80',
  'Motor': 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
  'Vespa': 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80',
  'Mobil': 'https://images.unsplash.com/photo-1502877338535-34cb0a5401db?w=800&q=80',
  'Helm': 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?w=800&q=80',
  
  // Properti
  'Rumah': 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80',
  'Apartemen': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
  'Kost': 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
  'Tanah': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',

  // Perabotan
  'Sofa': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
  'Meja': 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&q=80',
  'Lemari': 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80',
  'Kulkas': 'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=800&q=80',
  'Mesin Cuci': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80',

  // Hobi & Koleksi
  'Gitar': 'https://images.unsplash.com/photo-1510915361894-faa8b63a62f4?w=800&q=80',
  'Buku': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
  'Novel': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
  'Tenda': 'https://images.unsplash.com/photo-1504280390267-331062259f6a?w=800&q=80',
  'Matras': 'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=800&q=80',
  'Carier': 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80',
  'Raket': 'https://images.unsplash.com/photo-1622279457486-640c4cb68f2c?w=800&q=80',

  // Bayi & Anak
  'Stroller': 'https://images.unsplash.com/photo-1533512963162-8e7c10b2ba1d?w=800&q=80',
  'Mainan': 'https://images.unsplash.com/photo-1596461404969-9ce20c718c6f?w=800&q=80',

  // Kecantikan & Kesehatan
  'Lipstik': 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80',
  'Skincare': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80',
  'Parfum': 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80',
  'Masker': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
  'Humidifier': 'https://images.unsplash.com/photo-1547483238-f400e65ccd56?w=800&q=80',
  'Tensi': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',

  // Hewan Peliharaan
  'Kucing': 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&q=80',
  'Anjing': 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=80',

  // Default fallback if not matched
  'Pakaian': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80',
  'Cuci': 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=800&q=80',
  'Website': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
};

const regex = /title:\s*'([^']+)'(.*?)image:\s*'([^']+)'/gs;
code = code.replace(regex, (match, title, middle, img) => {
  let newImg = img;
  for (const [key, value] of Object.entries(imageMap)) {
    if (title.toLowerCase().includes(key.toLowerCase())) {
      newImg = value;
      break;
    }
  }
  return "title: '" + title + "'" + middle + "image: '" + newImg + "'";
});

fs.writeFileSync('prisma/seed.js', code);
console.log('Seed images updated successfully!');
