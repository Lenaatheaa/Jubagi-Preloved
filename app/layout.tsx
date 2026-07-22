import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { PushNotificationProvider } from '@/components/providers/PushNotificationProvider';

const inter = Inter({ subsets: ['latin'] });

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'JUBAGI - Marketplace Barang Bekas & Hibah #1',
  description: 'Temukan barang bekas berkualitas gratis lewat hibah atau beli langsung dengan harga terjangkau di JUBAGI.',
  keywords: ['barang bekas', 'hibah barang', 'marketplace hibah', 'peduli lingkungan', 'donasi barang', 'jubagi'],
  authors: [{ name: 'JUBAGI Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'JUBAGI - Marketplace Barang Bekas & Hibah #1',
    description: 'Temukan barang bekas berkualitas gratis lewat hibah atau beli langsung dengan harga terjangkau.',
    url: 'https://jubagi.com',
    siteName: 'JUBAGI',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JUBAGI - Marketplace Barang Bekas & Hibah #1',
    description: 'Beli barang bekas berkualitas atau dapatkan gratis melalui program hibah hanya di JUBAGI.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased transition-colors`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <PushNotificationProvider>
              <Suspense fallback={<div className="h-20" />}>
                <Navbar />
              </Suspense>
              <main className="min-h-screen pt-20">
                {children}
              </main>
              <Footer />
              <ToastProvider />
            </PushNotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
