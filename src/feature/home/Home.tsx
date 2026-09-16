'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Box, Stack, Typography } from '@mui/material'
import { PinnedPosts } from './PinnedPosts'
import { BlogPostCard } from '@ds/cards/BlogPostCard'
import { pinnedPosts } from './mocks/pinnedPosts'
import type { PostSummary } from '@lib/posts'
import { formatPostDate } from '@core/domain/post'
import { toggleLike, type LikeCounts, type LikeState } from '@core/use-cases/toggleLike'

/** 홈. 글 목록은 서버 페이지가 조회해서 넘겨줌 */
export default function Home({ posts }: { posts: PostSummary[] }) {
  const router = useRouter()

  const [likedPosts, setLikedPosts] = useState<LikeState>({})
  const [likeCounts, setLikeCounts] = useState<LikeCounts>({})

  const handleLike = (id: number) => {
    const { liked, counts } = toggleLike(id, likedPosts, likeCounts)
    setLikedPosts(liked)
    setLikeCounts(counts)
  }

  return (
    <Stack sx={{ width: '100%', minHeight: '100vh', gap: { xs: 3, md: 4 } }}>
      <PinnedPosts posts={pinnedPosts} />
      <Box sx={{ width: '100%' }}>
        <Typography mt={1} variant="body1" color="textSecondary">
          모든 포스트
        </Typography>
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
          gap={{ xs: 2, md: 3 }}
          mt={2}
        >
          {posts.map((post) => (
            <BlogPostCard
              key={post.id}
              tag={post.tag}
              title={post.title}
              excerpt={post.excerpt}
              imageUrl={post.image_url}
              likeCount={likeCounts[post.id] ?? 0}
              liked={likedPosts[post.id]}
              date={formatPostDate(post.published_at)}
              onLike={() => handleLike(post.id)}
              onClick={() => router.push(`/posts/${post.slug}`)}
              sx={{ maxWidth: '100%' }}
            />
          ))}
        </Box>
      </Box>
    </Stack>
  )
}
