'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarDays, Code2, Download, FileText, Loader2, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { MdxContent } from './MdxContent'
import { HtmlFrame } from './HtmlFrame'
import { useSession } from '@lib/useSession'
import { supabase } from '@lib/supabase'
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
  'design-system': '#2a5cff',
}

// ── MDX 다운로드 (관리자) ──────────────────────
// 글 페이지는 본문을 내려받지 않으므로(용량) 누를 때 조회. frontmatter + 본문
function DownloadMdxButton({ id, slug }: { id: number; slug: string }) {
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const download = async () => {
    setLoading(true)
    setFailed(false)
    const { data, error } = await supabase
      .from('posts').select('title, tag, excerpt, image_url, published_at, body').eq('id', id).single()
    setLoading(false)
    if (error || !data) { console.error(error); setFailed(true); return }

    // JSON 문자열은 그대로 유효한 YAML 값 → 따옴표·콜론 이스케이프 걱정 없음
    const meta = { title: data.title, tag: data.tag, date: data.published_at, excerpt: data.excerpt, image: data.image_url }
    const frontmatter = Object.entries(meta).map(([k, v]) => `${k}: ${JSON.stringify(v ?? '')}`).join('\n')
    const url = URL.createObjectURL(new Blob([`---\n${frontmatter}\n---\n\n${data.body}\n`], { type: 'text/markdown;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}.mdx`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={download}
      disabled={loading}
      className={failed ? 'text-destructive' : 'text-muted-foreground'}
      title={failed ? '다운로드 실패, 다시 시도' : 'MDX 파일로 다운로드'}
    >
      {loading ? <Loader2 className="animate-spin" /> : <Download />}
      {failed ? '다시 시도' : '다운로드'}
    </Button>
  )
}

// ── 글 삭제 (관리자) ──────────────────────────
function DeletePostButton({ id, title }: { id: number; title: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const remove = async () => {
    setDeleting(true)
    setError(null)
    // RLS 로 막히면 에러 없이 0행 삭제 → 삭제된 행을 돌려받아 확인
    const { data, error } = await supabase.from('posts').delete().eq('id', id).select('id')
    if (error || !data?.length) {
      setDeleting(false)
      setError(error ? `삭제 실패: ${error.message}` : '삭제 권한이 없습니다.')
      return
    }
    // ponytail: 홈·글 페이지는 revalidate 60 → 다른 방문자에겐 최대 60초 동안 보일 수 있음
    router.replace('/')
    router.refresh()
  }

  return (
    <Dialog onOpenChange={(open) => { if (!open) setError(null) }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <Trash2 />
          삭제
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>글을 삭제할까요?</DialogTitle>
          <DialogDescription>‘{title}’ 글이 영구 삭제되며 되돌릴 수 없습니다.</DialogDescription>
        </DialogHeader>
        {error && <Typography variant="body2" color="destructive" role="alert">{error}</Typography>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button variant="destructive" onClick={remove} disabled={deleting}>
            {deleting && <Loader2 className="animate-spin" />}
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── 보기 전환 스위치 ───────────────────────────
const VIEW_OPTIONS = [
  // 라벨만 TEXT. 내부 값은 mdx 그대로 — 상태·렌더 분기가 이 값을 쓴다
  { value: 'mdx' as const, label: 'TEXT', Icon: FileText, hint: '문서 보기' },
  { value: 'html' as const, label: 'HTML', Icon: Code2, hint: '원본 HTML 보기' },
]

/**
 * MDX / HTML 토글.
 * 움직이는 건 인디케이터 하나뿐 — 글자·아이콘까지 움직이면 읽는 중에 산만해진다.
 */
function ViewToggle({ view, onChange }: { view: 'mdx' | 'html'; onChange: (v: 'mdx' | 'html') => void }) {
  return (
    <div
      role="group"
      aria-label="보기 방식"
      className="relative ml-auto inline-grid grid-cols-2 rounded-[10px] bg-muted p-1 ring-1 ring-border"
    >
      {/* 트랙 폭의 절반이라 translate-x-full 이 정확히 두 번째 칸으로 간다 */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-[7px]',
          'bg-primary shadow-[0_2px_10px_rgba(42,92,255,0.45)]',
          'transition-transform duration-250 ease-out motion-reduce:transition-none',
          view === 'html' && 'translate-x-full',
        )}
      />
      {VIEW_OPTIONS.map(({ value, label, Icon, hint }) => {
        const active = view === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            title={hint}
            onClick={() => onChange(value)}
            className={cn(
              'relative z-10 flex h-7 w-[76px] items-center justify-center gap-1.5 rounded-[7px]',
              'font-mono text-caption uppercase transition-colors duration-200',
              'active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ── TOC 컴포넌트 ──────────────────────────────
function TableOfContents({ items, activeId }: { items: TocItem[]; activeId: string }) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="목차"
      className="sticky top-[92px] hidden max-h-[calc(100vh-108px)] w-[220px] shrink-0 self-start overflow-y-auto [scrollbar-width:none] lg:block [&::-webkit-scrollbar]:hidden"
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
export default function PostViewer({ post, code, html }: { post: PostSummary; code: string; html: string | null }) {
  const router = useRouter()
  const articleRef = useRef<HTMLElement>(null)
  const { isAdmin } = useSession()
  const [view, setView] = useState<'mdx' | 'html'>('mdx')

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
      // banner(60px) + 여유(30px) → 이 이상 올라온 헤딩 중 마지막이 active
      const OFFSET = 90
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

  const accent = tagColor[post.tag] ?? '#2a5cff'

  return (
    <div className="pb-20">
      {/* 뒤로가기 / 편집 */}
      <div className="mb-8 flex max-w-[740px] items-center gap-1">
        {/* 뒤로가기(history) 아니라 항상 홈으로: 외부 링크로 들어와도 목록이 나옴 */}
        <Button asChild variant="ghost" size="sm" className="group text-foreground hover:bg-foreground/8">
          <Link href="/">
            <ArrowLeft className="transition-transform duration-200 ease-out group-hover:-translate-x-0.5 motion-reduce:transition-none" />
            목록으로
          </Link>
        </Button>
        {isAdmin && (
          <>
            <Button variant="ghost" size="sm" onClick={() => router.push(`/editor/${post.slug}`)} className="text-muted-foreground" title="MDX 편집">
              <Pencil />
              편집
            </Button>
            <DownloadMdxButton id={post.id} slug={post.slug} />
            <DeletePostButton id={post.id} title={post.title} />
          </>
        )}
        {/* HTML 버전이 있을 때만 전환 */}
        {html && <ViewToggle view={view} onChange={setView} />}
      </div>

      {view === 'html' && html && <HtmlFrame html={html} title={post.title} />}

      {/* 2열 레이아웃: 본문 + TOC. HTML 보기 중엔 숨기기만 (언마운트하면 목차 추적이 끊김) */}
      <div className={cn('flex items-start lg:gap-12', view === 'html' && 'hidden')}>
        <article ref={articleRef} className="max-w-[740px] min-w-0 flex-1">
          <header className="mb-8 flex flex-col gap-4">
            {/* 날짜 → 태그 순의 메타 한 줄. 본문 맨 아래 떨어져 있던 날짜를 제목 위로 올렸다 */}
            <div className="flex flex-wrap items-center gap-3">
              <p className="flex items-center gap-2 text-body2 text-muted-foreground">
                <CalendarDays className="size-4" aria-hidden />
                <time dateTime={post.published_at}>{formatPostDate(post.published_at)}</time>
              </p>
              {post.tag && (
                <>
                  <span aria-hidden className="h-4 w-px bg-border" />
                  <Badge
                    variant="outline"
                    className="h-7 rounded-md px-2.5 text-body2 font-semibold"
                    style={{
                      backgroundColor: `${accent}18`,
                      color: accent === '#000000' ? undefined : accent,
                      borderColor: `${accent}33`,
                    }}
                  >
                    {post.tag}
                  </Badge>
                </>
              )}
            </div>
            <Typography variant="h2" as="h1" className="md:text-h1">{post.title}</Typography>
            <Typography variant="prose" color="muted">{post.excerpt}</Typography>
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
