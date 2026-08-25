import { MetadataRoute } from 'next';
import { adminStore } from '@/lib/admin-store';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hamzaphone.dz';
  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/track-order`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // Dynamic product routes
  const products = adminStore.getProducts({ pageSize: 500 }).items;
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/products/${p.slug || p.sku.toLowerCase()}`,
    lastModified: new Date(p.updatedAt || now),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Dynamic category routes
  const categories = ['ecrans-oled', 'batteries', 'connecteurs-charge', 'vitres-tactiles', 'outillage'];
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((slug) => ({
    url: `${baseUrl}/categories/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Dynamic brand routes
  const brands = ['samsung', 'apple', 'xiaomi', 'oppo', 'realme', 'huawei'];
  const brandRoutes: MetadataRoute.Sitemap = brands.map((slug) => ({
    url: `${baseUrl}/brands/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...brandRoutes, ...productRoutes];
}
