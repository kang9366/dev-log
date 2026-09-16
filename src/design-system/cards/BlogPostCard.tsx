import Link from 'next/link'
import { Heart, MessageCircle } from 'lucide-react'
import type { MouseEventHandler } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/ui/typography'

export interface BlogPostCardProps {
  href: string
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
  className?: string
}

export function BlogPostCard({
  href,
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
  className,
}: BlogPostCardProps) {
  return (
    <article
      className={cn(
        'group relative w-full overflow-hidden rounded-xl border bg-card text-card-foreground',
        'transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]',
        className,
      )}
    >
      <div className="relative overflow-hidden">
        {/* 외부 이미지 URL 이 글마다 달라 next/image 대신 img */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt}
          className="block h-[220px] w-full object-cover transition-transform duration-400 group-hover:scale-105"
        />
        {tag && (
          <Badge className="absolute top-3 left-3 h-[26px] rounded-md bg-card px-2 text-caption font-medium text-foreground shadow-[0_1px_4px_rgba(0,0,0,0.12)]">
            {tag}
          </Badge>
        )}
      </div>

      <div className="px-5 pt-5 pb-3">
        <Typography variant="h6" as="h3" clamp={2} className="mb-2 group-hover:underline">
          {/* 카드 전체를 덮는 링크 (크롤러가 따라갈 수 있는 실제 <a>) */}
          <Link href={href} className="after:absolute after:inset-0">
            {title}
          </Link>
        </Typography>

        <Typography variant="body2" color="muted" clamp={2} className="mb-4">{excerpt}</Typography>

        <div className="flex items-center justify-between text-caption text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <MessageCircle className="size-4" aria-hidden />
              <span className="sr-only">댓글</span>
              {commentCount}
            </span>
            {/* 링크 위로 올려서 클릭이 글 이동으로 새지 않게 */}
            <button
              type="button"
              onClick={onLike}
              aria-pressed={liked}
              aria-label="좋아요"
              className={cn('relative z-10 flex items-center gap-1 transition-colors hover:text-destructive', liked && 'text-destructive')}
            >
              <Heart className={cn('size-4', liked && 'fill-current')} aria-hidden />
              {likeCount}
            </button>
          </div>
          <time>{date}</time>
        </div>
      </div>
    </article>
  )
}

export default BlogPostCard
