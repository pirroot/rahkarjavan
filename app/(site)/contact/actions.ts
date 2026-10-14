'use server';

import { prisma } from '@/lib/prisma';
import { ipFromHeaders, rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const str = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? '')
    .trim()
    .slice(0, max);

export async function submitContact(formData: FormData) {
  // Honeypot — bots fill hidden fields; pretend success and leave
  if (String(formData.get('website') ?? '').trim()) redirect('/contact?sent=1');

  const name = str(formData.get('name'), 120);
  const email = str(formData.get('email'), 254).toLowerCase();
  const subject = str(formData.get('subject'), 160);
  const message = str(formData.get('message'), 5000);

  if (name.length < 2 || !EMAIL_RE.test(email) || subject.length < 3 || message.length < 10) {
    redirect('/contact?sent=0');
  }

  const h = await headers();
  const ip = ipFromHeaders(h);

  // 5 submissions per 10 minutes per IP
  if (!rateLimit(`contact:${ip}`, 5, 10 * 60_000)) redirect('/contact?sent=limit');

  try {
    await prisma.contact.create({ data: { name, email, subject, message } });
  } catch (err) {
    console.error('[contact] save failed:', err);
    redirect('/contact?sent=error');
  }

  redirect('/contact?sent=1');
}
