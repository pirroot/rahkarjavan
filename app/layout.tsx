import { ThemeProvider } from '@/components/ThemeProvider';
import { getBrand } from '@/lib/settings';
import { SITE } from '@/lib/site';
import raviFont from '@/utils/font';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return {
    metadataBase: new URL(SITE.url),
    title: {
      default: `${brand.name} | رسانه تصویری و مجله`,
      template: `%s | ${brand.shortName}`,
    },
    description: brand.description,
    applicationName: brand.shortName,
    openGraph: {
      type: 'website',
      locale: 'fa_IR',
      siteName: brand.name,
      title: `${brand.name} | رسانه تصویری و مجله`,
      description: brand.description,
      url: SITE.url,
    },
    twitter: { card: 'summary_large_image' },
    icons: { icon: '/favicon.ico' },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0b0f19' },
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fa"
      dir="rtl"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`scroll-smooth ${raviFont.variable}`}
    >
      <head>
        <noscript>
          <style>{`.reveal{opacity:1;transform:none}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-screen flex-col bg-gray-50 text-gray-900 antialiased dark:bg-brand-dark dark:text-gray-100">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
