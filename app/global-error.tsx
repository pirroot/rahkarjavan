'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{ fontFamily: 'Tahoma', display: 'grid', placeItems: 'center', minHeight: '100vh' }}
      >
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 20 }}>خطای غیرمنتظره</h1>
          <button
            onClick={reset}
            style={{
              marginTop: 12,
              padding: '10px 24px',
              background: '#e11d2e',
              color: '#fff',
              borderRadius: 8,
            }}
          >
            تلاش مجدد
          </button>
        </div>
      </body>
    </html>
  );
}
