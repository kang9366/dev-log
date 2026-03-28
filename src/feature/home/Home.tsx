import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Stack, Typography } from '@mui/material'
import { PinnedPosts } from './PinnedPosts'
import { BlogPostCard } from '@ds/cards/BlogPostCard'
import { pinnedPosts } from './mocks/pinnedPosts'
import { recentPosts } from './mocks/recentPosts'
import { toggleLike, type LikeCounts, type LikeState } from '@core/use-cases/toggleLike'

export default function Home() {
  const navigate = useNavigate()

  const initialCounts = useMemo<LikeCounts>(
    () => Object.fromEntries(recentPosts.map((p) => [p.id, p.likeCount])),
    []
  )

  const [likedPosts, setLikedPosts] = useState<LikeState>({})
  const [likeCounts, setLikeCounts] = useState<LikeCounts>(initialCounts)

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
          {recentPosts.map((post) => (
            <BlogPostCard
              key={post.id}
              tag={post.tag}
              title={post.title}
              excerpt={post.excerpt}
              imageUrl={post.imageUrl}
              commentCount={post.commentCount}
              likeCount={likeCounts[post.id] ?? 0}
              liked={likedPosts[post.id]}
              date={post.date}
              onLike={() => handleLike(post.id)}
              onClick={() => navigate(`/posts/${post.slug}`)}
              sx={{ maxWidth: '100%' }}
            />
          ))}
        </Box>
      </Box>
    </Stack>
  )
}
