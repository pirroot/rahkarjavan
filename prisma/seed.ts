import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { prisma } from '../lib/prisma';

// Minimal production seed:
// - Admin user from .env
// - One BOTH category (serves video + magazine sections)
// - One published article + one published video (so homepage/ticker/hero render)
// - Full site settings — the site looks complete before the admin touches anything

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

async function main() {
  // ---------- 1) Admin (credentials from .env) ----------
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD before running the seed.');
  }

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { emailVerifiedAt: new Date() },
    create: {
      name: 'مدیر سایت',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });
  console.log('Admin created ✅');

  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) throw new Error('Admin creation failed.');

  // ---------- 2) One category — BOTH so it serves video + magazine ----------
  const category = await prisma.category.upsert({
    where: { slug: 'general' },
    update: { name: 'عمومی', section: 'BOTH' },
    create: { name: 'عمومی', slug: 'general', section: 'BOTH' },
  });
  console.log('Category ready ✅');

  // ---------- 3) One article ----------
  await prisma.news.upsert({
    where: { slug: 'welcome-to-rahkarjavan' },
    update: {},
    create: {
      title: 'به پایگاه خبری راهکار جوان خوش آمدید',
      slug: 'welcome-to-rahkarjavan',
      excerpt:
        'اولین مطلب رسمی راهکار جوان منتشر شد؛ اینجا رسانه تصویری و مجله‌ای برای نسل جوان است.',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'راهکار جوان با هدف روایت تازه از خبرهای امروز — مصاحبه، گزارش ویژه و تحلیل برای نسل جوان — آغاز به کار کرد. این نخستین مطلب رسمی ماست.',
              },
            ],
          },
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'از این پس مصاحبه‌ها، گزارش‌های ویژه و اخبار را در دو بخش رسانه تصویری و مجله دنبال کنید.',
              },
            ],
          },
        ],
      },
      coverUrl: '/logo.png',
      categoryId: category.id,
      authorId: admin.id,
      status: 'PUBLISHED',
      publishedAt: daysAgo(0),
      isBreaking: false,
      featured: true,
      tags: ['راهکار جوان'],
    },
  });
  console.log('Article seeded ✅');

  // ---------- 4) One video ----------
  await prisma.video.upsert({
    where: { slug: 'welcome-video' },
    update: {},
    create: {
      title: 'معرفی راهکار جوان',
      slug: 'welcome-video',
      description: 'اولین ویدیوی معرفی پایگاه خبری راهکار جوان.',
      videoUrl: '', // admin uploads the real file from the panel
      duration: '00:00',
      categoryId: category.id,
      authorId: admin.id,
      status: 'PUBLISHED',
      publishedAt: daysAgo(0),
      isLive: false,
      featured: true,
      tags: ['راهکار جوان'],
    },
  });
  console.log('Video seeded ✅');

  // ---------- 5) Full site settings — complete from day one ----------
  // Mirrors DEFAULT_SETTINGS in lib/settings.ts, with logo from /public.
  const siteSettings = {
    siteName: 'پایگاه خبری راهکار جوان',
    shortName: 'راهکار جوان',
    description:
      'رسانه تصویری و مجله راهکار جوان؛ مصاحبه، گزارش ویژه و تازه‌ترین اخبار برای نسل جوان.',
    logoUrl: '/logo.png',
    email: process.env.MAIL_FROM?.match(/<(.+)>/)?.[1] ?? 'news@rahkarjavan.ir',
    phone: '',
    telegram: '',
    instagram: '',
    eitaa: '',
    youtube: '',
    footerText:
      'پایگاه خبری راهکار جوان؛ رسانه‌ای تصویری و خبری برای نسل جوان — مصاحبه، گزارش ویژه و تازه‌ترین اخبار را اینجا ببینید.',
  };

  await prisma.setting.upsert({
    where: { key: 'site' },
    update: { value: siteSettings },
    create: { key: 'site', value: siteSettings },
  });
  console.log('Site settings seeded ✅');

  console.log('🎉 Production seed finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
