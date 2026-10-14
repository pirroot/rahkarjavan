import { z } from 'zod';

// ---------- فهرست منابع ----------
export const CONTENT_RESOURCES = ['news', 'videos', 'categories', 'media', 'comments'] as const;
export const ADMIN_ONLY_RESOURCES = ['contacts', 'subscribers', 'settings'] as const;

export const ALL_RESOURCES = [...CONTENT_RESOURCES, ...ADMIN_ONLY_RESOURCES] as const;
export type Resource = (typeof ALL_RESOURCES)[number];

export const RESOURCE_TITLES: Record<Resource, string> = {
  news: 'خبرها',
  videos: 'ویدیوها',
  categories: 'دسته‌بندی‌ها',
  media: 'رسانه‌ها',
  comments: 'دیدگاه‌ها',
  contacts: 'پیام‌ها',
  subscribers: 'خبرنامه',
  settings: 'تنظیمات',
};

// ---------- اعتبارسنجی و دسترسی ----------
export function isResource(value: string): value is Resource {
  return (ALL_RESOURCES as readonly string[]).includes(value);
}

// نام قدیمی — برای سازگاری با فایل‌های موجود (alias همان isResource)
export function validAdminResource(value: string): value is Resource {
  return isResource(value);
}

/** مدیر: همه‌چیز / نویسنده: فقط منابع محتوایی */
export function canAccessResource(role: string, resource: Resource): boolean {
  if (role === 'ADMIN') return true;
  return (CONTENT_RESOURCES as readonly string[]).includes(resource);
}

// ---------- اسکیمای ورودی هر منبع ----------
const contentStatus = z.enum(['DRAFT', 'PUBLISHED']);
const contactStatus = z.enum(['NEW', 'READ', 'ARCHIVED']);
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || null);
const slugField = z
  .string()
  .trim()
  .min(1)
  .max(240)
  .transform((v) => v.replace(/\s+/g, '-')); // فاصله → خط تیره
const jsonContent = z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]);

export function parseAdminInput(resource: Resource, input: unknown, userId: string) {
  const body = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  switch (resource) {
    case 'news': {
      const result = z
        .object({
          title: z.string().trim().min(1).max(240),
          slug: slugField,
          excerpt: z.string().trim().min(1).max(500),
          content: jsonContent,
          categoryId: z.string().min(1),
          status: contentStatus,
          publishedAt: z.coerce.date().default(() => new Date()),
          tags: z.array(z.string()).default([]),
          coverUrl: optionalString,
          authorName: optionalString,
          featured: z.boolean().default(false),
          isBreaking: z.boolean().default(false),
          metaTitle: optionalString,
          metaDescription: optionalString,
        })
        .safeParse(body);
      return result.success
        ? { data: { ...result.data, authorId: userId } }
        : { error: result.error.flatten() };
    }
    case 'videos': {
      const result = z
        .object({
          title: z.string().trim().min(1).max(240),
          slug: slugField,
          description: z.string().trim().min(1),
          duration: z.string().trim().min(1),
          categoryId: z.string().min(1),
          status: contentStatus,
          publishedAt: z.coerce.date().default(() => new Date()),
          videoUrl: optionalString,
          thumbnailUrl: optionalString,
          isLive: z.boolean().default(false),
          featured: z.boolean().default(false),
          tags: z.array(z.string()).default([]),
          metaTitle: optionalString,
          metaDescription: optionalString,
        })
        .safeParse(body);
      return result.success
        ? { data: { ...result.data, authorId: userId } }
        : { error: result.error.flatten() };
    }
    case 'categories': {
      const result = z
        .object({
          name: z.string().trim().min(1).max(100),
          slug: slugField,
          section: z.enum(['ARTICLE', 'VIDEO', 'BOTH']),
        })
        .safeParse(body);
      return result.success ? { data: result.data } : { error: result.error.flatten() };
    }
    case 'media': {
      const result = z
        .object({
          url: z.string().trim().url(),
          mimeType: z.string().trim().min(1),
          alt: z.string().default(''),
          credit: optionalString,
          fileSize: z.coerce.number().int().nonnegative().nullable().optional(),
          width: z.coerce.number().int().positive().nullable().optional(),
          height: z.coerce.number().int().positive().nullable().optional(),
        })
        .safeParse(body);
      return result.success
        ? { data: { ...result.data, uploaderId: userId } }
        : { error: result.error.flatten() };
    }
    case 'contacts': {
      const result = z.object({ status: contactStatus }).safeParse(body);
      return result.success ? { data: result.data } : { error: result.error.flatten() };
    }
    case 'subscribers': {
      const result = z
        .object({
          email: z.string().trim().toLowerCase().email(),
          isActive: z.boolean().default(true),
        })
        .safeParse(body);
      return result.success ? { data: result.data } : { error: result.error.flatten() };
    }
    case 'settings': {
      const result = z
        .object({ key: z.string().trim().min(1).max(120), value: jsonContent })
        .safeParse(body);
      return result.success ? { data: result.data } : { error: result.error.flatten() };
    }
    case 'comments':
      return { error: 'دیدگاه‌ها فقط قابل حذف هستند.' };
  }
}
