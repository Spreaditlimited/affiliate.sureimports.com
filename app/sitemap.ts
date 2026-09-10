import type { MetadataRoute } from 'next';

const siteUrl = 'https://affiliate.sureimports.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date('2026-09-10'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/affiliate-terms`,
      lastModified: new Date('2026-09-10'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
