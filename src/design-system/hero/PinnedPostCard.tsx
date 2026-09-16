import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Post } from '@core/domain/post'
import { Typography } from '@/components/ui/typography'

export interface PinnedPostCardProps {
  post: Post
  index: number
  animating: boolean
  direction: 'left' | 'right'
}

const EASE = 'cubic-bezier(0.25,0.46,0.45,0.94)'

export function PinnedPostCard({ post, index, animating, direction }: PinnedPostCardProps) {
  const slideOutX = direction === 'right' ? '-40px' : '40px'
  const contentSlideOutX = direction === 'right' ? '-28px' : '28px'

  return (
    <>
      {/* 이미지 */}
      <div className="relative min-h-[220px] overflow-hidden rounded-t-2xl sm:min-h-[280px] md:min-h-[380px] md:rounded-l-2xl md:rounded-tr-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={post.id}
          src={post.image}
          alt={post.title}
          className="absolute inset-0 block size-full object-cover"
          style={{
            transition: `opacity 0.35s ease, transform 0.6s ${EASE}`,
            opacity: animating ? 0 : 1,
            transform: animating ? `translateX(${slideOutX}) scale(0.97)` : 'translateX(0) scale(1)',
          }}
        />
        <span className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-3 py-1.5 text-subtitle2 font-bold text-white backdrop-blur-sm">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* 내용 */}
      <div className="flex flex-col justify-center overflow-hidden rounded-b-2xl border bg-card px-6 py-6 sm:px-8 sm:py-8 md:rounded-r-2xl md:rounded-bl-none md:px-12 md:py-10">
        <div
          style={{
            transition: `opacity 0.3s ease, transform 0.35s ${EASE}`,
            opacity: animating ? 0 : 1,
            transform: animating ? `translateX(${contentSlideOutX})` : 'translateX(0)',
          }}
        >
          <Badge variant="outline" className="mb-5 h-[26px] rounded-full bg-neutral-50 px-3 text-caption text-muted-foreground dark:bg-neutral-800">
            {post.category}
          </Badge>

          <Typography variant="h3" as="h2" className="mb-6 whitespace-pre-line md:text-h2">
            {post.title}
          </Typography>

          <Typography variant="body2" color="subtle" className="mb-9">{post.excerpt}</Typography>

          <Button
            asChild
            className="h-auto rounded-[10px] bg-neutral-900 px-7 py-3 text-subtitle2 font-semibold text-white hover:-translate-y-px hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            <Link href={post.href}>Read More</Link>
          </Button>
        </div>
      </div>
    </>
  )
}

export default PinnedPostCard
