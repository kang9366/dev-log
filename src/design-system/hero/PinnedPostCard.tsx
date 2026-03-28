import { Box, Button, Chip, Typography } from '@mui/material'
import type { Post } from '@core/domain/post'

export interface PinnedPostCardProps {
  post: Post
  index: number
  animating: boolean
  direction: 'left' | 'right'
}

export function PinnedPostCard({ post, index, animating, direction }: PinnedPostCardProps) {
  const slideOutX = direction === 'right' ? '-40px' : '40px'
  const contentSlideOutX = direction === 'right' ? '-28px' : '28px'

  const imgStyle = animating
    ? { opacity: 0, transform: `translateX(${slideOutX}) scale(0.97)` }
    : { opacity: 1, transform: 'translateX(0) scale(1)' }

  const contentStyle = animating
    ? { opacity: 0, transform: `translateX(${contentSlideOutX})` }
    : { opacity: 1, transform: 'translateX(0)' }

  return (
    <>
      {/* 이미지 박스 */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: { xs: '16px 16px 0 0', md: '16px 0 0 16px' },
          minHeight: { xs: 220, sm: 280, md: 380 },
        }}
      >
        <Box
          component="img"
          key={post.id}
          src={post.image}
          alt={post.title}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'opacity 0.35s ease, transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)',
            ...imgStyle,
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            bgcolor: 'rgba(0,0,0,0.6)',
            color: '#fff',
            px: 1.5,
            py: 0.75,
            borderRadius: '8px',
            backdropFilter: 'blur(6px)',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.04em',
          }}
        >
          {String(index + 1).padStart(2, '0')}
        </Box>
      </Box>

      {/* 콘텐츠 박스 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          px: { xs: 3, sm: 4, md: 6 },
          py: { xs: 3, sm: 4, md: 5 },
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: { xs: '0 0 16px 16px', md: '0 16px 16px 0' },
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            transition: 'opacity 0.3s ease, transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
            ...contentStyle,
          }}
        >
          <Chip
            label={post.category}
            variant="outlined"
            size="small"
            sx={{
              mb: 2.5,
              fontSize: 12,
              color: 'text.secondary',
              borderColor: 'divider',
              bgcolor: 'grey.50',
              borderRadius: '20px',
              height: 26,
            }}
          />

          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: '-0.03em',
              color: 'text.primary',
              mb: 3,
              whiteSpace: 'pre-line',
              fontSize: { xs: 24, md: 32 },
            }}
          >
            {post.title}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'text.disabled',
              lineHeight: 1.75,
              letterSpacing: '-0.01em',
              mb: 4.5,
            }}
          >
            {post.excerpt}
          </Typography>

          <Button
            href={post.href}
            component="a"
            variant="contained"
            disableElevation
            sx={{
              bgcolor: 'grey.900',
              color: '#fff',
              borderRadius: '10px',
              px: 3.5,
              py: 1.5,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              alignSelf: 'flex-start',
              textTransform: 'none',
              '&:hover': {
                bgcolor: 'grey.700',
                transform: 'translateY(-1px)',
              },
              transition: 'background 0.18s, transform 0.18s',
            }}
          >
            Read More
          </Button>
        </Box>
      </Box>
    </>
  )
}

export default PinnedPostCard

