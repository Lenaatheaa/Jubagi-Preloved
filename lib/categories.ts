export type CategoryItem = {
  name: string;
};

export type SubCategory = {
  name: string;
  items: CategoryItem[];
};

export type MainCategory = {
  id: string;
  name: string;
  iconName: string;
  iconBgColor: string;
  iconTextColor: string;
  emoji: string;
  subcategories: SubCategory[];
};

export const CATEGORIES: MainCategory[] = [
  {
    id: 'fashion',
    name: 'Fashion',
    iconName: 'Shirt',
    iconBgColor: 'bg-rose-50 dark:bg-rose-500/10',
    iconTextColor: 'text-rose-500',
    emoji: '👗',
    subcategories: [{ 
      name: 'Pakaian & Sepatu', 
      items: [
        { name: 'Pakaian Pria' }, { name: 'Pakaian Wanita' }, { name: 'Sepatu' }, 
        { name: 'Tas & Dompet' }, { name: 'Jam Tangan' }, { name: 'Aksesoris & Perhiasan' }, 
        { name: 'Baju Muslim' }, { name: 'Pakaian Anak' }
      ] 
    }]
  },
  {
    id: 'elektronik',
    name: 'Elektronik & HP',
    iconName: 'Tv',
    iconBgColor: 'bg-blue-50 dark:bg-blue-500/10',
    iconTextColor: 'text-blue-500',
    emoji: '💻',
    subcategories: [{ 
      name: 'Gadget & Komputer', 
      items: [
        { name: 'Handphone' }, { name: 'Laptop' }, { name: 'Tablet' }, 
        { name: 'PC Desktop' }, { name: 'Keyboard & Mouse' }, { name: 'Audio, Earphone & Speaker' }, 
        { name: 'Kamera & Lensa' }, { name: 'TV & Monitor' }, { name: 'Printer & Scanner' }, 
        { name: 'Konsol Game (PS, Xbox, dll)' }, { name: 'Aksesoris Gadget' }, { name: 'Komponen Komputer' }
      ] 
    }]
  },
  {
    id: 'kendaraan',
    name: 'Kendaraan',
    iconName: 'Car',
    iconBgColor: 'bg-indigo-50 dark:bg-indigo-500/10',
    iconTextColor: 'text-indigo-500',
    emoji: '🚗',
    subcategories: [{ 
      name: 'Otomotif', 
      items: [
        { name: 'Mobil Bekas' }, { name: 'Motor Bekas' }, { name: 'Sepeda' }, 
        { name: 'Aksesoris Mobil' }, { name: 'Aksesoris Motor' }, { name: 'Sparepart & Suku Cadang' }, 
        { name: 'Helm & Jaket Motor' }, { name: 'Velg & Ban' }
      ] 
    }]
  },
  {
    id: 'properti',
    name: 'Properti',
    iconName: 'Home',
    iconBgColor: 'bg-teal-50 dark:bg-teal-500/10',
    iconTextColor: 'text-teal-500',
    emoji: '🏠',
    subcategories: [{ 
      name: 'Properti', 
      items: [
        { name: 'Rumah' }, { name: 'Kost' }, { name: 'Apartemen' }, 
        { name: 'Tanah' }, { name: 'Ruko & Tempat Usaha' }, { name: 'Villa' }
      ] 
    }]
  },
  {
    id: 'perabotan-rumah',
    name: 'Perabotan Rumah',
    iconName: 'Sofa',
    iconBgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
    iconTextColor: 'text-emerald-600',
    emoji: '🛋️',
    subcategories: [{ 
      name: 'Rumah Tangga', 
      items: [
        { name: 'Meja' }, { name: 'Kursi & Sofa' }, { name: 'Lemari & Rak' }, 
        { name: 'Kasur & Tempat Tidur' }, { name: 'Alat Dapur & Makan' }, { name: 'Dekorasi & Lampu' }, 
        { name: 'Kulkas & Freezer' }, { name: 'Mesin Cuci' }, { name: 'AC & Kipas Angin' }
      ] 
    }]
  },
  {
    id: 'hobi-koleksi',
    name: 'Hobi & Koleksi',
    iconName: 'Puzzle',
    iconBgColor: 'bg-purple-50 dark:bg-purple-500/10',
    iconTextColor: 'text-purple-500',
    emoji: '🎮',
    subcategories: [{ 
      name: 'Koleksi', 
      items: [
        { name: 'Buku & Majalah' }, { name: 'Mainan & Action Figure' }, { name: 'Alat Musik' }, 
        { name: 'Tiket & Voucher' }, { name: 'Barang Antik & Seni' }, { name: 'Alat Olahraga' }, 
        { name: 'K-Pop & Merchandise' }, { name: 'Peralatan Kemah / Outdoor' }
      ] 
    }]
  },
  {
    id: 'bayi-anak',
    name: 'Bayi & Anak',
    iconName: 'Baby',
    iconBgColor: 'bg-pink-50 dark:bg-pink-500/10',
    iconTextColor: 'text-pink-500',
    emoji: '🍼',
    subcategories: [{ 
      name: 'Kebutuhan Bayi', 
      items: [
        { name: 'Pakaian Bayi & Anak' }, { name: 'Mainan Edukasi' }, { name: 'Kereta Bayi (Stroller)' }, 
        { name: 'Perlengkapan Makan & Susu' }, { name: 'Perlengkapan Mandi' }, { name: 'Box & Tempat Tidur Bayi' }
      ] 
    }]
  },
  {
    id: 'kecantikan-kesehatan',
    name: 'Kesehatan & Kecantikan',
    iconName: 'Heart',
    iconBgColor: 'bg-amber-50 dark:bg-amber-500/10',
    iconTextColor: 'text-amber-500',
    emoji: '💄',
    subcategories: [{ 
      name: 'Skincare & Medis', 
      items: [
        { name: 'Skincare & Perawatan Wajah' }, { name: 'Make Up / Kosmetik' }, { name: 'Parfum & Wewangian' }, 
        { name: 'Perawatan Rambut & Tubuh' }, { name: 'Alat Medis Pribadi' }, { name: 'Vitamin & Suplemen' }
      ] 
    }]
  },
  {
    id: 'hewan-peliharaan',
    name: 'Hewan Peliharaan',
    iconName: 'Dog',
    iconBgColor: 'bg-orange-50 dark:bg-orange-500/10',
    iconTextColor: 'text-orange-500',
    emoji: '🐱',
    subcategories: [{ 
      name: 'Kebutuhan Hewan', 
      items: [
        { name: 'Makanan Kucing' }, { name: 'Makanan Anjing' }, { name: 'Kandang & Tas Hewan' }, 
        { name: 'Aksesoris & Mainan Hewan' }, { name: 'Pasir Kucing' }, { name: 'Aquarium & Aksesoris Ikan' }
      ] 
    }]
  },
  {
    id: 'jasa-lainnya',
    name: 'Jasa & Lainnya',
    iconName: 'LayoutGrid',
    iconBgColor: 'bg-gray-50 dark:bg-gray-500/10',
    iconTextColor: 'text-gray-500',
    emoji: '📦',
    subcategories: [{ 
      name: 'Jasa & Lain-lain', 
      items: [
        { name: 'Jasa Servis Elektronik' }, { name: 'Jasa Desain / Freelance' }, { name: 'Jasa Pindah / Angkut' }, 
        { name: 'Barang Bekas Campur / Borongan' }, { name: 'Lainnya' }
      ] 
    }]
  }
];
