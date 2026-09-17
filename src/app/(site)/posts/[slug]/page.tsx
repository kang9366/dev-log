import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import PostViewer from '@feature/post/PostViewer'
import { getPublishedPost, getPublishedPosts } from '@lib/posts'
import { compileMdx } from '@lib/mdx'

type Props = { params: Promise<{ slug: string }> }

export const revalidate = 60

// generateMetadata 와 페이지가 같은 요청에서 한 번만 조회하도록
const getPost = cache(async (rawSlug: string) => {
  let slug = rawSlug
  try {
    slug = decodeURIComponent(rawSlug) // 한글 slug 가 인코딩된 채로 올 수 있음
  } catch {
    return null
  }
  return getPublishedPost(slug)
})

export async function generateStaticParams() {
  return (await getPublishedPosts()).map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost((await params).slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/posts/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      publishedTime: post.published_at,
      images: post.image_url ? [post.image_url] : [],
    },
  }
}

export default async function PostPage({ params }: Props) {
  const post = await getPost((await params).slug)
  if (!post) notFound()

  const { body, html, ...summary } = post
  return <PostViewer post={summary} code={await compileMdx(body)} html={html} />
}
