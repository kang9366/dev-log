'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MdxContent } from './MdxContent'
import { useSession } from '@lib/useSession'
import { formatPostDate } from '@core/domain/post'
import type { PostSummary } from '@lib/posts'
import { Typography } from '@/components/ui/typography'

// ── 타입 ─────────────────────────────────────
interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

const tagColor: Record<string, string> = {
  react:           '#61dafb',
  'next.js':       '#000000',
  typescript:      '#3178c6',
  css:             '#e44d27',
  performance:     '#f5a623',
  'design-system': '#6366f1',
}

// ── TOC 컴포넌트 ──────────────────────────────
function TableOfContents({ items, activeId }: { items: TocItem[]; activeId: string }) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="목차"
      className="sticky top-[58px] hidden max-h-[calc(100vh-66px)] w-[220px] shrink-0 self-start overflow-y-auto [scrollbar-width:none] lg:block [&::-webkit-scrollbar]:hidden"
    >
      <Typography variant="overline" as="p" color="subtle" className="mb-3 pl-2.5 font-bold">On this page</Typography>
      <ul>
        {items.map((item) => {
          const isActive = activeId === item.id
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? 'location' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className={cn(
                  'block rounded-r border-l-2 py-[5px] pr-2 transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.08]',
                  item.level === 3 ? 'pl-[22px] text-caption' : 'pl-2.5 text-body2',
                  isActive
                    ? 'border-primary font-semibold text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border',
                )}
              >
                {item.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ── PostViewer ────────────────────────────────
/** 글 상세. 데이터와 컴파일된 본문(code)은 서버 페이지가 넘겨줌 */
export default function PostViewer({ post, code }: { post: PostSummary; code: string }) {
  const router = useRouter()
  const articleRef = useRef<HTMLElement>(null)
  const { isAdmin } = useSession()

  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState('')

  // 렌더 후 헤딩 수집 — id가 없어도 직접 생성·부여
  useEffect(() => {
    function collectHeadings() {
      const article = articleRef.current
      if (!article) return false

      const els = Array.from(article.querySelectorAll('h2, h3'))
      if (els.length === 0) return false

      const items: TocItem[] = []
      els.forEach((el) => {
        const text = el.textContent?.trim() ?? ''
        if (!text) return

        // id 없으면 텍스트에서 생성 후 DOM에 직접 부여
        if (!el.id) {
          el.id = text
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ-]/g, '')
            .replace(/-{2,}/g, '-')
            .replace(/^-|-$/g, '')
        }

        if (el.id) {
          items.push({
            id: el.id,
            text,
            level: parseInt(el.tagName[1]) as 2 | 3,
          })
        }
      })

      if (items.length > 0) {
        setTocItems(items)
        return true
      }
      return false
    }

    // 1차: 200ms 후 시도
    const timer = setTimeout(() => {
      if (collectHeadings()) return

      // 2차: MutationObserver로 콘텐츠 렌더 완료 감지 후 재시도
      const observer = new MutationObserver(() => {
        if (collectHeadings()) observer.disconnect()
      })
      if (articleRef.current) {
        observer.observe(articleRef.current, { childList: true, subtree: true })
        setTimeout(() => observer.disconnect(), 3000)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [code])

  // 활성 헤딩 추적 — rAF 스로틀 scroll 기반
  // IntersectionObserver 대비 장점:
  //  1) 최상단 스크롤 시 첫 항목 정확히 강조 (rootMargin 이슈 없음)
  //  2) requestAnimationFrame으로 60fps 상한 스로틀 → 성능 개선
  //  3) 헤딩 요소 캐싱으로 매 프레임 DOM 쿼리 제거
  useEffect(() => {
    if (tocItems.length === 0) return

    // 헤딩 요소 캐싱 (스크롤마다 getElementById 반복 방지)
    const headingEls = tocItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)

    if (headingEls.length === 0) return

    let rafId = 0
    let prevActiveId = ''

    const update = () => {
      // banner(50px) + 여유(30px) → 이 이상 올라온 헤딩 중 마지막이 active
      const OFFSET = 80
      let activeIdx = 0

      for (let i = 0; i < headingEls.length; i++) {
        if (headingEls[i].getBoundingClientRect().top <= OFFSET) {
          activeIdx = i
        } else {
          break
        }
      }

      const nextId = tocItems[activeIdx].id
      // 값이 바뀔 때만 setState → 불필요한 리렌더 방지
      if (nextId !== prevActiveId) {
        prevActiveId = nextId
        setActiveId(nextId)
      }
    }

    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update() // 초기 상태 설정

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [tocItems])

  const accent = tagColor[post.tag] ?? '#6366f1'

  return (
    <div className="pb-20">
      {/* 뒤로가기 / 편집 */}
      <div className="mb-8 flex items-center gap-2">
        <Button variant="ghost" size="lg" onClick={() => router.back()} className="text-muted-foreground">
          <ArrowLeft />
          목록으로
        </Button>
        {isAdmin && (
          <Button variant="ghost" size="lg" onClick={() => router.push(`/editor/${post.slug}`)} className="text-muted-foreground" title="MDX 편집">
            <Pencil />
            편집
          </Button>
        )}
      </div>

      {/* 2열 레이아웃: 본문 + TOC */}
      <div className="flex items-start lg:gap-12">
        <article ref={articleRef} className="max-w-[740px] min-w-0 flex-1">
          <header className="mb-8 flex flex-col gap-4">
            <div>
              <Badge
                variant="outline"
                className="h-[26px] rounded-md px-2 text-caption font-semibold"
                style={{
                  backgroundColor: `${accent}18`,
                  color: accent === '#000000' ? undefined : accent,
                  borderColor: `${accent}33`,
                }}
              >
                {post.tag}
              </Badge>
            </div>
            <Typography variant="h2" as="h1" className="md:text-h1">{post.title}</Typography>
            <Typography variant="prose" color="muted">{post.excerpt}</Typography>
            <p className="flex items-center gap-1.5 text-caption text-neutral-400">
              <CalendarDays className="size-3.5" aria-hidden />
              <time dateTime={post.published_at}>{formatPostDate(post.published_at)}</time>
            </p>
          </header>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.image_url}
            alt={post.title}
            className="mb-10 block h-[200px] w-full rounded-xl object-cover sm:h-[280px] md:h-[360px]"
          />

          <hr className="mb-10 border-border" />

          <MdxContent code={code} />
        </article>

        {/* TOC 사이드바 */}
        <TableOfContents items={tocItems} activeId={activeId} />
      </div>
    </div>
  )
}
