import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import {
  Box, Chip, CircularProgress, Divider,
  IconButton, Stack, Typography, Tooltip,
} from '@mui/material'
import ArrowBackIcon     from '@mui/icons-material/ArrowBack'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import EditIcon          from '@mui/icons-material/Edit'
import { mdxComponents } from './MdxComponents'

// ── 타입 ─────────────────────────────────────
interface PostMeta {
  title: string
  date: string
  tag: string
  excerpt: string
  imageUrl: string
  slug: string
}

interface TocItem {
  id: string
  text: string
  level: 2 | 3
}

// ── glob ─────────────────────────────────────
const postModules = import.meta.glob<{
  default: React.ComponentType
  meta: PostMeta
}>('/src/content/posts/*.mdx')

const slugToPath: Record<string, string> = Object.fromEntries(
  Object.keys(postModules).map((path) => {
    const slug = path.split('/').pop()!.replace(/\.mdx$/, '')
    return [slug, path]
  })
)

const tagColor: Record<string, string> = {
  react:           '#61dafb',
  'next.js':       '#000000',
  typescript:      '#3178c6',
  css:             '#e44d27',
  performance:     '#f5a623',
  'design-system': '#6366f1',
}

type ViewerState =
  | { kind: 'loading' }
  | { kind: 'notFound' }
  | { kind: 'ready'; Content: React.ComponentType; meta: PostMeta }

// ── TOC 컴포넌트 ──────────────────────────────
function TableOfContents({
  items,
  activeId,
}: {
  items: TocItem[]
  activeId: string
}) {
  if (items.length === 0) return null

  return (
    <Box
      component="nav"
      aria-label="목차"
      sx={{
        display: { xs: 'none', lg: 'block' },
        width: 220,
        flexShrink: 0,
        alignSelf: 'flex-start',        // 부모 flex 높이에 늘어나지 않도록
        position: 'sticky',
        top: 58,                        // banner(50px) + gap(8px)
        maxHeight: 'calc(100vh - 66px)',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {/* 라벨 */}
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 700,
          color: 'text.disabled',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          mb: 1.5,
          pl: '10px',
        }}
      >
        On this page
      </Typography>

      {/* 목록 */}
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {items.map((item) => {
          const isActive = activeId === item.id
          return (
            <Box component="li" key={item.id}>
              <Box
                component="a"
                href={`#${item.id}`}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault()
                  document.getElementById(item.id)?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }}
                sx={{
                  display: 'block',
                  py: '5px',
                  pl: item.level === 3 ? '22px' : '10px',
                  pr: 1,
                  fontSize: item.level === 2 ? '0.8125rem' : '0.75rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'primary.main' : 'text.secondary',
                  textDecoration: 'none',
                  lineHeight: 1.5,
                  borderLeft: '2px solid',
                  borderColor: isActive ? 'primary.main' : 'transparent',
                  borderRadius: '0 4px 4px 0',
                  transition: 'color 0.15s, border-color 0.15s, background 0.15s',
                  '&:hover': {
                    color: 'text.primary',
                    bgcolor: 'action.hover',
                    borderColor: isActive ? 'primary.main' : 'divider',
                  },
                }}
              >
                {item.text}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

// ── PostViewer ────────────────────────────────
export default function PostViewer() {
  const { slug }  = useParams<{ slug: string }>()
  const navigate  = useNavigate()
  const articleRef = useRef<HTMLElement>(null)

  const [state,    setState]    = useState<ViewerState>({ kind: 'loading' })
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState('')

  // MDX 로드
  useEffect(() => {
    let cancelled = false
    const path   = slug ? slugToPath[slug] : undefined
    const loader = path ? postModules[path] : undefined

    if (!loader) {
      Promise.resolve().then(() => { if (!cancelled) setState({ kind: 'notFound' }) })
      return () => { cancelled = true }
    }

    loader().then((mod) => {
      if (!cancelled) {
        setState({ kind: 'ready', Content: mod.default, meta: mod.meta })
        window.scrollTo({ top: 0, behavior: 'instant' })
      }
    }).catch(() => {
      Promise.resolve().then(() => { if (!cancelled) setState({ kind: 'notFound' }) })
    })

    return () => { cancelled = true }
  }, [slug])

  // 렌더 후 헤딩 수집 — id가 없어도 직접 생성·부여
  useEffect(() => {
    if (state.kind !== 'ready') return

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
  }, [state.kind])

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

  // ── 로딩 / 404 ───────────────────────────────
  if (state.kind === 'loading') {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={36} />
      </Box>
    )
  }

  if (state.kind === 'notFound') {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} mb={1}>포스트를 찾을 수 없습니다</Typography>
        <Typography color="text.secondary" mb={3}>존재하지 않는 포스트이거나 삭제되었습니다.</Typography>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon /> 돌아가기
        </IconButton>
      </Box>
    )
  }

  const { Content, meta } = state
  const accent = tagColor[meta.tag] ?? '#6366f1'

  return (
    <Box sx={{ pb: 10 }}>
      {/* 뒤로가기 / 편집 */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          onClick={() => navigate(-1)}
          sx={{ gap: 0.5, borderRadius: '8px', px: 1.5, py: 0.75, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}
        >
          <ArrowBackIcon fontSize="small" />
          <Typography variant="body2" component="span">목록으로</Typography>
        </IconButton>

        <Tooltip title="MDX 편집">
          <IconButton
            onClick={() => navigate(`/editor/${slug}`)}
            sx={{ borderRadius: '8px', px: 1.5, py: 0.75, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: 'text.primary' } }}
          >
            <EditIcon fontSize="small" />
            <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>편집</Typography>
          </IconButton>
        </Tooltip>
      </Box>

      {/* 2열 레이아웃: 본문 + TOC */}
      <Box sx={{ display: 'flex', gap: { lg: 6 }, alignItems: 'flex-start' }}>

        {/* 본문 */}
        <Box component="article" ref={articleRef} sx={{ flex: 1, minWidth: 0, maxWidth: 740 }}>
          <Stack spacing={2} mb={4}>
            <Box>
              <Chip
                label={meta.tag}
                size="small"
                sx={{
                  bgcolor: `${accent}18`,
                  color: accent === '#000000' ? '#333' : accent,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: `1px solid ${accent}33`,
                  borderRadius: '6px',
                  height: 26,
                }}
              />
            </Box>
            <Typography
              variant="h1"
              component="h1"
              sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.03em', color: 'text.primary' }}
            >
              {meta.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.75, fontSize: '1.0625rem' }}>
              {meta.excerpt}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled">{meta.date}</Typography>
            </Stack>
          </Stack>

          <Box
            component="img"
            src={meta.imageUrl}
            alt={meta.title}
            sx={{ width: '100%', height: { xs: 200, sm: 280, md: 360 }, objectFit: 'cover', borderRadius: '12px', display: 'block', mb: 5 }}
          />

          <Divider sx={{ mb: 5 }} />

          <MDXProvider components={mdxComponents}>
            <Content />
          </MDXProvider>
        </Box>

        {/* TOC 사이드바 */}
        <TableOfContents items={tocItems} activeId={activeId} />
      </Box>
    </Box>
  )
}
