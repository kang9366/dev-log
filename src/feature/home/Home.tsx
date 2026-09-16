import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Stack, Typography } from '@mui/material'
import { PinnedPosts } from './PinnedPosts'
import { BlogPostCard } from '@ds/cards/BlogPostCard'
import { pinnedPosts } from './mocks/pinnedPosts'
import { supabase } from '../../lib/supabase'
import { formatPostDate, type PostRecord } from '@core/domain/post'
import { toggleLike, type LikeCounts, type LikeState } from '@core/use-cases/toggleLike'

type PostSummary = Omit<PostRecord, 'body'>

export default function Home() {
  const navigate = useNavigate()

  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    supabase
      .from('posts')
      .select('id, slug, title, tag, excerpt, image_url, published_at, published')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error(error)
          setLoadError(true)
        } else {
          setPosts(data)
        }
      })
  }, [])

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
        {loadError && (
          <Typography mt={2} color="error">
            포스트를 불러오지 못했습니다.
          </Typography>
        )}
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
              onClick={() => navigate(`/posts/${post.slug}`)}
              sx={{ maxWidth: '100%' }}
            />
          ))}
        </Box>
      </Box>
    </Stack>
  )
}
