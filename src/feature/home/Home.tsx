'use client'
import { useState } from 'react'
import { BlogPostCard } from '@ds/cards/BlogPostCard'
import type { PostSummary } from '@lib/posts'
import { formatPostDate } from '@core/domain/post'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/ui/typography'

// 알약 위치 (lg 이상, 히어로 영역 기준 %) · r: 기울기
// ponytail: 자리 8개. 태그가 더 많아지면 겹침 → 자리 추가하거나 격자 배치로 전환
const SPOTS = [
  { left: 62, top: 18, r: 6 },
  { left: 80, top: 16, r: -4 },
  { left: 71, top: 50, r: 3 },
  { left: 89, top: 48, r: -3 },
  { left: 61, top: 82, r: -5 },
  { left: 79, top: 84, r: 5 },
  { left: 52, top: 16, r: -2 },
  { left: 52, top: 86, r: 2 },
]

const HANDLES = ['-top-[9px] -left-[9px]', '-top-[9px] -right-[9px]', '-bottom-[9px] -left-[9px]', '-bottom-[9px] -right-[9px]']

/** 홈. 글 목록은 서버 페이지가 조회해서 넘겨줌 */
export default function Home({ posts }: { posts: PostSummary[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [over, setOver] = useState(false)

  const tags = [...new Set(posts.map((p) => p.tag).filter(Boolean))]
  const visible = selected ? posts.filter((p) => p.tag === selected) : posts

  return (
    <div className="mx-auto w-full max-w-[968px] pb-18">
      <section aria-label="태그 필터" className="relative flex flex-col justify-center gap-4.5 py-8 lg:min-h-[300px]">
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
          <Typography variant="h1" as="h1" className="font-medium tracking-[-0.03em] whitespace-nowrap text-muted-foreground lg:text-display lg:font-medium">
            <strong className="font-extrabold text-foreground">Posts</strong> about
          </Typography>

          {/* 드롭 영역. 채워지면 누르면 해제 */}
          {selected ? (
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label={`${selected} 필터 해제`}
              className="relative rounded-full border-2 border-primary bg-primary px-5.5 py-1.5 text-h4 font-bold whitespace-nowrap text-primary-foreground outline-[1.5px] outline-offset-4 outline-primary transition-opacity hover:opacity-90 lg:text-h2"
            >
              {selected}
              {HANDLES.map((pos) => (
                <span key={pos} aria-hidden className={cn('absolute size-2 rounded-[2px] border-[1.5px] border-primary bg-white', pos)} />
              ))}
            </button>
          ) : (
            <span
              onDragOver={(e) => { e.preventDefault(); setOver(true) }}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => { setSelected(e.dataTransfer.getData('text/plain')); setOver(false) }}
              className={cn(
                'rounded-full border-2 border-dashed px-5.5 py-1.5 text-h4 font-bold whitespace-nowrap text-neutral-400 transition-[border-color,background-color,color,box-shadow] duration-200 lg:text-h2',
                over && 'border-solid border-primary bg-primary/10 text-primary shadow-[0_0_0_6px] shadow-primary/10',
              )}
            >
              drag a tag here
            </span>
          )}
        </div>

        <Typography variant="caption" className="font-mono text-neutral-400">
          drag or tap a tag · click the pill to reset
        </Typography>

        {/* 모바일: 문장 아래 줄 배치 / lg: 오른쪽에 흩뿌림. 떠다니는 모션은 둘 다 */}
        {/* ponytail: HTML5 드래그는 터치에서 안 됨 → 모바일은 탭으로 선택 */}
        <div className="flex flex-wrap gap-x-2 gap-y-4 pt-2 lg:pointer-events-none lg:absolute lg:inset-0 lg:block">
          {tags.map((tag, i) => {
            const spot = SPOTS[i % SPOTS.length]
            return (
              <button
                key={tag}
                type="button"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', tag)}
                onClick={() => setSelected(tag)}
                aria-label={`${tag} 태그로 필터`}
                style={{ left: `${spot.left}%`, top: `${spot.top}%`, '--r': `${spot.r}deg`, animationDuration: `${5 + (i % 4) * 0.9}s`, animationDelay: `${-i * 0.8}s` } as React.CSSProperties}
                className={cn(
                  'cursor-grab rounded-full motion-safe:animate-floaty border-[1.5px] bg-card px-4 py-2 text-subtitle2 font-semibold whitespace-nowrap shadow-[0_2px_10px_rgba(22,23,27,0.07)] transition-[box-shadow,opacity,border-color] duration-200 hover:border-primary hover:shadow-[0_8px_22px_rgba(22,23,27,0.14)] active:cursor-grabbing',
                  'lg:pointer-events-auto lg:absolute lg:-translate-x-1/2 lg:-translate-y-1/2 lg:px-6 lg:py-3 lg:text-subtitle1 lg:font-semibold',
                  // 선택된 알약: 모바일은 줄에서 빼서 빈자리 없앰, lg 는 자리 유지하고 숨김
                  tag === selected && 'max-lg:hidden lg:pointer-events-none lg:opacity-0',
                )}
              >
                {tag}
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <div className="mb-6.5 flex items-baseline justify-between border-t pt-4.5">
          <Typography variant="overline" as="h2" className="font-mono">All Posts</Typography>
          <Typography variant="caption" color="muted" className="font-mono">{visible.length} posts</Typography>
        </div>
        <div className="grid grid-cols-1 gap-7.5 sm:grid-cols-2">
          {visible.map((post, i) => (
            <BlogPostCard
              key={post.id}
              href={`/posts/${post.slug}`}
              index={i + 1}
              tag={post.tag}
              title={post.title}
              excerpt={post.excerpt}
              imageUrl={post.image_url}
              date={formatPostDate(post.published_at)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
