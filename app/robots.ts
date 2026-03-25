import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://unfiltered-parul.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/settings', '/maintenance'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
