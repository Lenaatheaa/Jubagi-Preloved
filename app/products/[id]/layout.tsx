import { Metadata } from 'next';
import { db as prisma } from '@/lib/db';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
  
  if (isNaN(id)) {
    return { title: 'Produk Tidak Ditemukan - JUBAGI' };
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: true }
  });

  if (!product) {
    return { title: 'Produk Tidak Ditemukan - JUBAGI' };
  }

  const title = `${product.title} - JUBAGI`;
  const descText = product.description || 'Temukan barang ini di JUBAGI Marketplace.';
  const description = descText.length > 150 ? descText.slice(0, 150) + '...' : descText;
  const imageUrl = product.images[0]?.imageUrl || 'https://jubagi.com/default-share.jpg';

  const formattedPrice = product.type === 'hibah' 
    ? 'Gratis (Hibah)' 
    : `Rp ${product.price?.toLocaleString('id-ID')}`;

  return {
    title,
    description: `${formattedPrice} • ${description}`,
    openGraph: {
      title,
      description: `${formattedPrice} • ${description}`,
      url: `https://jubagi.com/products/${id}`,
      siteName: 'JUBAGI',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: product.title || 'Gambar Produk',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: `${formattedPrice} • ${description}`,
      images: [imageUrl],
    },
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
