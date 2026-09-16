import type { MetadataRoute } from 'next'
import { getPublishedPosts } from '@lib/posts'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getPublishedPosts()
  return [
    { url: SITE_URL, changeFrequency: 'daily' },
    ...posts.map((post) => ({
      url: `${SITE_URL}/posts/${encodeURIComponent(post.slug)}`,
      lastModified: post.published_at,
    })),
  ]
}
