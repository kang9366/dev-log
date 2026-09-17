import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/ui/typography'

export interface BlogPostCardProps {
  href: string
  /** 목록 순번 (01, 02 …) */
  index: number
  tag?: string
  title: string
  excerpt: string
  imageUrl: string
  imageAlt?: string
  date: string
  className?: string
}

export function BlogPostCard({
  href,
  index,
  tag,
  title,
  excerpt,
  imageUrl,
  imageAlt = '',
  date,
  className,
}: BlogPostCardProps) {
  return (
    <article className={cn('group relative flex flex-col', className)}>
      <div className="relative rounded-2xl border bg-card transition-[translate,box-shadow] duration-250 group-focus-within:-translate-y-[3px] group-focus-within:shadow-[0_18px_40px_-18px_rgba(22,23,27,0.25)] group-hover:-translate-y-[3px] group-hover:shadow-[0_18px_40px_-18px_rgba(22,23,27,0.25)]">
        {/* 외부 이미지 URL 이 글마다 달라 next/image 대신 img */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt}
          className="block aspect-[3/2] w-full rounded-2xl object-cover"
        />
        {/* hover: 디자인 툴 선택 박스 (테두리 + 모서리 핸들 + 태그 + 읽기 버튼) */}
        <div aria-hidden className="pointer-events-none absolute -inset-px rounded-2xl border-[1.5px] border-primary opacity-0 transition-opacity duration-180 group-focus-within:opacity-100 group-hover:opacity-100">
          {['-top-[5px] -left-[5px]', '-top-[5px] -right-[5px]', '-bottom-[5px] -left-[5px]', '-bottom-[5px] -right-[5px]'].map((pos) => (
            <span key={pos} className={cn('absolute size-2 rounded-[2px] border-[1.5px] border-primary bg-white', pos)} />
          ))}
          {tag && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded bg-primary px-[7px] py-0.5 font-mono text-caption whitespace-nowrap text-primary-foreground">
              {tag}
            </span>
          )}
          {/* liquid glass: 뒤 이미지 blur + 채도 올림, 안쪽 하이라이트로 유리 두께감 */}
          <span className="absolute bottom-3.5 left-1/2 -translate-x-1/2 rounded-full border border-white/35 bg-black/25 px-3.5 py-[7px] text-caption font-bold whitespace-nowrap text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-1px_1px_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.2)] backdrop-blur-md backdrop-saturate-[1.8] [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]">
            Read post →
          </span>
        </div>
      </div>

      <div className="px-1 pt-4">
        <div className="mb-2 flex justify-between gap-3 font-mono text-caption">
          <span className="text-primary">{String(index).padStart(2, '0')}</span>
          <span className="text-muted-foreground">
            {tag && `${tag} · `}<time>{date}</time>
          </span>
        </div>
        <Typography variant="h4" as="h3" clamp={2} className="font-bold decoration-1 underline-offset-4 group-hover:underline">
          {/* 카드 전체를 덮는 링크 (크롤러가 따라갈 수 있는 실제 <a>) */}
          <Link href={href} className="after:absolute after:inset-0">
            {title}
          </Link>
        </Typography>
        <Typography variant="body2" color="muted" clamp={3} className="mt-1 max-w-[560px] decoration-1 underline-offset-4 group-hover:underline">{excerpt}</Typography>
      </div>
    </article>
  )
}

export default BlogPostCard
