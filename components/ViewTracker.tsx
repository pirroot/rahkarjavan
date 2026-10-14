'use client';

import { useEffect } from 'react';

export default function ViewTracker({
  collection,
  slug,
}: {
  collection: 'articles' | 'videos';
  slug: string;
}) {
  useEffect(() => {
    const key = `view:${collection}:${slug}`;

    // Skip if this content was already counted in this browser session
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    fetch(`/api/views/${collection}/${encodeURIComponent(slug)}`, {
      method: 'POST',
    })
      .then((r) => {
        if (!r.ok) console.warn('[ViewTracker] server responded', r.status);
      })
      .catch(() => {
        // Silent — a missed view must never break the page
      });
  }, [collection, slug]);

  return null;
}
