import { prisma } from '@/lib/prisma';

// ---------- Types ----------
export type SiteSettings = {
  siteName: string;
  shortName: string;
  description: string;
  logoUrl: string;
  email: string;
  phone: string;
  telegram: string;
  instagram: string;
  eitaa: string;
  youtube: string;
  footerText: string;
};

/** Branding object passed from (site)/layout to Header/Footer */
export type Brand = {
  name: string;
  shortName: string;
  logoUrl: string;
  email: string;
  phone: string;
  description: string;
  footerText: string;
  socials: { telegram: string; instagram: string; eitaa: string; youtube: string };
};

// Defaults — used until the admin saves settings for the first time.
// After that, the DB value wins on every field individually.
export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: 'پایگاه خبری راهکار جوان',
  shortName: 'راهکار جوان',
  description:
    'رسانه تصویری و مجله راهکار جوان؛ مصاحبه، گزارش ویژه و تازه‌ترین اخبار برای نسل جوان.',
  logoUrl: '',
  email: 'news@rahkarjavan.ir',
  phone: '',
  telegram: '',
  instagram: '',
  eitaa: '',
  youtube: '',
  footerText: '',
};

/** Read settings on the server — never throws, always returns a complete object */
export async function getSettings(): Promise<SiteSettings> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: 'site' } });
    const value = row?.value as Partial<SiteSettings> | undefined;
    return { ...DEFAULT_SETTINGS, ...(value ?? {}) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Build the Brand object shared by layout → Header/Footer */
export async function getBrand(): Promise<Brand> {
  const s = await getSettings();
  return {
    name: s.siteName,
    shortName: s.shortName,
    logoUrl: s.logoUrl,
    email: s.email,
    phone: s.phone,
    description: s.description,
    footerText: s.footerText,
    socials: {
      telegram: s.telegram,
      instagram: s.instagram,
      eitaa: s.eitaa,
      youtube: s.youtube,
    },
  };
}
