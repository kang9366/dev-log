import { createClient } from '@supabase/supabase-js'
import type { PostRecord } from '@core/domain/post'

export type PostSummary = Omit<PostRecord, 'body' | 'html'>

/** 서버 전용: 공개(출간) 글 조회. 세션 없이 publishable 키로 RLS 적용 */
const db = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

export async function getPublishedPosts(): Promise<PostSummary[]> {
  const { data, error } = await db()
    .from('posts')
    .select('id, slug, title, tag, excerpt, image_url, published_at, published')
    .eq('published', true)
    .order('published_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getPublishedPost(slug: string): Promise<PostRecord | null> {
  const { data, error } = await db()
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()
  if (error) throw error
  return data
}
