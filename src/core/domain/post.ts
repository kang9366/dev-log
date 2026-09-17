/** Supabase public.posts 행 */
export interface PostRecord {
  id: number
  slug: string
  title: string
  tag: string
  excerpt: string
  image_url: string
  published_at: string  // 'YYYY-MM-DD'
  body: string
  html: string | null   // 글의 HTML 버전 (선택)
  published: boolean
}

/** '2025-11-19' → '25. 11. 19' */
export const formatPostDate = (date: string) => date.slice(2).replaceAll('-', '. ')
