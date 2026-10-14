import Footer from '@/components/Footer';
import Header from '@/components/Header';
import { getBrand, type Brand } from '@/lib/settings';
import { SITE } from '@/lib/site';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrand();
  return {
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
  };
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // DB read once per request — feeds Header, Footer and the org JSON-LD
  const brand: Brand = await getBrand();

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'NewsMediaOrganization',
        '@id': `${SITE.url}/#org`,
        name: brand.name,
        url: SITE.url,
        logo: {
          '@type': 'ImageObject',
          // JSON-LD requires absolute URLs
          url: brand.logoUrl
            ? brand.logoUrl.startsWith('http')
              ? brand.logoUrl
              : `${SITE.url}${brand.logoUrl}`
            : `${SITE.url}/favicon.ico`,
        },
        // Social profiles — Google uses these for the knowledge panel
        sameAs: Object.values(brand.socials).filter(Boolean),
        contactPoint: {
          '@type': 'ContactPoint',
          email: brand.email,
          contactType: 'newsroom',
          availableLanguage: ['fa'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#website`,
        url: SITE.url,
        name: brand.name,
        inLanguage: 'fa-IR',
        publisher: { '@id': `${SITE.url}/#org` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE.url}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <>
      <Header brand={brand} />
      {children}
      <Footer brand={brand} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
    </>
  );
}
