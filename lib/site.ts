export const SITE = {
  name: 'پایگاه خبری راهکار جوان',
  shortName: 'راهکار جوان',
  description:
    'رسانه تصویری و مجله راهکار جوان؛ مصاحبه، گزارش ویژه و تازه‌ترین اخبار برای نسل جوان.',
  contactEmail: 'news@rahkarjavan.ir',
  // TODO: put real files in /public and real URLs before launch
  logoUrl: '/logo.png', // 512×512 square PNG
  ogImage: '/og.jpg', // 1200×630 — default share image
  socials: [
    'https://t.me/rahkarjavan',
    'https://youtube.com/@rahkarjavan',
    'https://eitaa.com/rahkarjavan',
  ],
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
} as const;
