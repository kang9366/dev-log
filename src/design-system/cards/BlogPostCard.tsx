import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Stack,
  type SxProps,
  type Theme,
  Typography,
} from '@mui/material'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import type { MouseEventHandler } from 'react'

export interface BlogPostCardProps {
  tag?: string
  title: string
  excerpt: string
  imageUrl: string
  imageAlt?: string
  commentCount?: number
  likeCount?: number
  date: string
  liked?: boolean
  onLike?: MouseEventHandler<HTMLButtonElement>
  onClick?: () => void
  sx?: SxProps<Theme>
}

export function BlogPostCard({
  tag,
  title,
  excerpt,
  imageUrl,
  imageAlt = '',
  commentCount = 0,
  likeCount = 0,
  date,
  liked = false,
  onLike,
  onClick,
  sx,
}: BlogPostCardProps) {
  return (
    <Card
      onClick={onClick}
      sx={{
        width: '100%',
        borderRadius: 3,
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider',
        cursor: onClick ? 'pointer' : 'default',
        overflow: 'hidden', // Card가 모든 자식 클리핑 담당
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        '&:hover':
          onClick
            ? {
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                transform: 'translateY(-2px)',
                '& .card-image': { transform: 'scale(1.05)' },
                '& .card-title': { textDecoration: 'underline' },
              }
            : {},
        bgcolor: 'background.paper',
        ...sx,
      }}
    >
      {/* borderRadius 제거 - 상위 Card의 overflow:hidden 이 클리핑 처리 */}
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          height="220"
          image={imageUrl}
          alt={imageAlt}
          className="card-image"
          sx={{
            objectFit: 'cover',
            display: 'block', // inline gap(하단 여백) 제거
            transition: 'transform 0.4s ease',
          }}
        />
        {tag && (
          <Chip
            label={tag}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: 'background.paper',
              color: 'text.primary',
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 26,
              borderRadius: 1.5,
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            }}
          />
        )}
      </Box>

      <CardContent sx={{ pt: 2.5, pb: '12px !important', px: 2.5 }}>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          lineHeight={1.45}
          className="card-title"
          sx={{
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '1rem',
            color: 'text.primary',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.6,
            mb: 2,
            fontSize: '0.875rem',
          }}
        >
          {excerpt}
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Box display="flex" alignItems="center" gap={0.5}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled">
                {commentCount}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={0.5} ml={0.5}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  onLike?.(e)
                }}
                disableRipple
                sx={{ p: 0, color: liked ? 'error.main' : 'text.disabled' }}
              >
                {liked ? <FavoriteIcon sx={{ fontSize: 16 }} /> : <FavoriteBorderIcon sx={{ fontSize: 16 }} />}
              </IconButton>
              <Typography variant="caption" color={liked ? 'error.main' : 'text.disabled'}>
                {likeCount}
              </Typography>
            </Box>
          </Stack>

          <Typography variant="caption" color="text.disabled">
            {date}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default BlogPostCard

