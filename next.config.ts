import type { NextConfig } from 'next';

const mediaHost = (() => {
  try {
    return process.env.MEDIA_BASE_URL ? new URL(process.env.MEDIA_BASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'rahkarjavan.ir' },
      ...(mediaHost ? [{ protocol: 'https' as const, hostname: mediaHost }] : []),
    ],
  },
};

export default nextConfig;
