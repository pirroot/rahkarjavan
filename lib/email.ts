type TransactionalEmail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function buildVerifyEmail(name: string, verifyUrl: string) {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(verifyUrl);
  const font = "Tahoma,'Vazirmatn',Arial,sans-serif";

  const html = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>تأیید ایمیل | راهکار جوان</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f5f9;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    برای فعال‌سازی حساب خود در راهکار جوان، ایمیلتان را تأیید کنید. این لینک تا ۲۴ ساعت معتبر است.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" dir="rtl"
               style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e8f0;font-family:${font};">

          <tr>
            <td align="center" style="background-color:#1e3a8a;padding:28px 24px;">
              <div style="font-size:22px;font-weight:bold;color:#ffffff;">راهکار جوان</div>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 32px 12px 32px;text-align:right;color:#1f2937;">
              <h1 style="margin:0 0 16px 0;font-size:20px;line-height:1.6;color:#111827;">تأیید نشانی ایمیل</h1>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:2;">${safeName} عزیز، سلام</p>
              <p style="margin:0 0 24px 0;font-size:15px;line-height:2;color:#374151;">
                از اینکه به راهکار جوان پیوستید، سپاسگزاریم. برای اطمینان از اینکه این نشانی متعلق به شماست و برای فعال‌سازی حساب کاربری، لطفاً روی دکمهٔ زیر کلیک کنید.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 32px 24px 32px;">
              <a href="${safeUrl}" target="_blank"
                 style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:14px 36px;border-radius:10px;font-family:${font};">
                تأیید ایمیل و ورود به حساب
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 24px 32px;text-align:right;">
              <p style="margin:0;font-size:13px;line-height:2;color:#6b7280;">
                این لینک به مدت <strong style="color:#374151;">۲۴ ساعت</strong> معتبر است. پس از آن، می‌توانید از داخل برنامه لینک جدیدی درخواست کنید.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 28px 32px;text-align:right;">
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;">
                <p style="margin:0 0 6px 0;font-size:12px;line-height:1.9;color:#6b7280;">
                  اگر دکمهٔ بالا کار نکرد، آدرس زیر را کپی کرده و در مرورگر خود باز کنید:
                </p>
                <p dir="ltr" style="margin:0;font-size:12px;line-height:1.8;color:#2563eb;word-break:break-all;text-align:left;">
                  ${safeUrl}
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px 32px 32px;text-align:right;">
              <p style="margin:0;font-size:13px;line-height:2;color:#6b7280;border-top:1px solid #eef0f4;padding-top:20px;">
                اگر شما این حساب را ایجاد نکرده‌اید، نیازی به هیچ اقدامی نیست؛ کافی است این ایمیل را نادیده بگیرید.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="background-color:#f9fafb;padding:18px 24px;border-top:1px solid #eef0f4;">
              <p style="margin:0;font-size:12px;line-height:1.9;color:#9ca3af;">
                این ایمیل به‌صورت خودکار ارسال شده است؛ لطفاً به آن پاسخ ندهید.<br />
                © راهکار جوان
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `${name} عزیز، سلام`,
    '',
    'برای تأیید نشانی ایمیل و فعال‌سازی حساب خود در راهکار جوان، لینک زیر را در مرورگر باز کنید. این لینک تا ۲۴ ساعت معتبر است:',
    verifyUrl,
    '',
    'اگر شما این حساب را ایجاد نکرده‌اید، این پیام را نادیده بگیرید.',
  ].join('\n');

  return { html, text };
}

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string) {
  const { html, text } = buildVerifyEmail(name, verifyUrl);

  await sendEmail({
    to,
    subject: 'تأیید ایمیل در راهکار جوان',
    html,
    text,
  });
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export async function sendEmail({ to, subject, html, text }: TransactionalEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) {
    throw new Error('Email delivery is not configured. Set RESEND_API_KEY and MAIL_FROM.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Email provider rejected the message (${response.status}): ${details}`);
  }
}
