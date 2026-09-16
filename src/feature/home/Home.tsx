'use client'
import { useState } from 'react'
import { PinnedPosts } from './PinnedPosts'
import { BlogPostCard } from '@ds/cards/BlogPostCard'
import { pinnedPosts } from './mocks/pinnedPosts'
import type { PostSummary } from '@lib/posts'
import { formatPostDate } from '@core/domain/post'
import { toggleLike, type LikeCounts, type LikeState } from '@core/use-cases/toggleLike'
import { Typography } from '@/components/ui/typography'

/** 홈. 글 목록은 서버 페이지가 조회해서 넘겨줌 */
export default function Home({ posts }: { posts: PostSummary[] }) {
  const [likedPosts, setLikedPosts] = useState<LikeState>({})
  const [likeCounts, setLikeCounts] = useState<LikeCounts>({})

  const handleLike = (id: number) => {
    const { liked, counts } = toggleLike(id, likedPosts, likeCounts)
    setLikedPosts(liked)
    setLikeCounts(counts)
  }

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 md:gap-8">
      <PinnedPosts posts={pinnedPosts} />
      <section className="w-full">
        <Typography variant="subtitle1" as="h2" color="muted" className="mt-2">모든 포스트</Typography>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard
              key={post.id}
              href={`/posts/${post.slug}`}
              tag={post.tag}
              title={post.title}
              excerpt={post.excerpt}
              imageUrl={post.image_url}
              likeCount={likeCounts[post.id] ?? 0}
              liked={likedPosts[post.id]}
              date={formatPostDate(post.published_at)}
              onLike={() => handleLike(post.id)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
