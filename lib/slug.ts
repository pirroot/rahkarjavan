/**
 * Normalizes a URL slug coming from route params.
 * Browsers encode non-ASCII slugs (Persian → %D8%A8...) and some
 * Next.js versions pass them still-encoded — this decodes safely.
 * Falls back to the raw input when it was already decoded (no % sequences).
 */
export function normalizeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).trim();
  } catch {
    // decodeURIComponent throws on stray '%' — input was already plain text
    return slug.trim();
  }
}
