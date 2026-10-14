import { prisma } from '@/lib/prisma';
import { createOpaqueToken, hashToken, siteUrl } from '@/lib/auth';
import { isEmailConfigured, sendVerificationEmail } from '@/lib/email';

const TTL_MS = 1000 * 60 * 60 * 24;

export async function sendUserVerificationEmail(user: { id: string; name: string; email: string }) {
  const token = createOpaqueToken();
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationTokenHash: await hashToken(token),
      emailVerificationExpiresAt: new Date(Date.now() + TTL_MS),
    },
  });

  const verifyUrl = `${siteUrl()}/api/auth/verify?token=${token}`;
  if (isEmailConfigured()) {
    await sendVerificationEmail(user.email, user.name, verifyUrl);
    return;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Email delivery is not configured.');
  }
  console.info(`[auth] لینک تأیید ${user.email}: ${verifyUrl}`);
}
