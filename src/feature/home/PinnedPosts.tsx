import { Box } from '@mui/material'
import type { Post } from '@core/domain/post'
import { useSlider } from '@core/hooks/useSlider'
import { SliderArrowButton } from '@ds/navigation/SliderArrowButton'
import { SliderDots } from '@ds/navigation/SliderDots'
import { PinnedPostCard } from '@ds/hero/PinnedPostCard'

interface PinnedPostsProps {
  posts: Post[]
  autoPlayInterval?: number
}

export function PinnedPosts({ posts, autoPlayInterval = 5000 }: PinnedPostsProps) {
  const { current, animating, direction, go, prev, next } = useSlider({
    total: posts.length,
    autoPlayInterval,
  })

  const post = posts[current]

  return (
    <Box component="section" sx={{ width: '100%', userSelect: 'none' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          minHeight: { xs: 'auto', sm: 380, md: 420 },
          position: 'relative',
        }}
      >
        <PinnedPostCard post={post} index={current} animating={animating} direction={direction} />
        <SliderArrowButton direction="left" onClick={prev} />
        <SliderArrowButton direction="right" onClick={next} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <SliderDots total={posts.length} current={current} onDotClick={go} />
      </Box>
    </Box>
  )
}

export default PinnedPosts

