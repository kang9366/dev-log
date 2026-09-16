'use client'
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import CodeMirror from '@uiw/react-codemirror'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { oneDarkHighlightStyle } from '@codemirror/theme-one-dark'
import { MDXProvider } from '@mdx-js/react'
import { Box, CircularProgress, InputBase, Tooltip } from '@mui/material'
import { Button } from '@ds/components/Button'
import { Text }   from '@ds/components/Typography'
import ArrowBackIcon           from '@mui/icons-material/ArrowBack'
import FormatBoldIcon          from '@mui/icons-material/FormatBold'
import FormatItalicIcon        from '@mui/icons-material/FormatItalic'
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough'
import FormatQuoteIcon         from '@mui/icons-material/FormatQuote'
import InsertLinkIcon          from '@mui/icons-material/InsertLink'
import InsertPhotoIcon         from '@mui/icons-material/InsertPhoto'
import CodeIcon                from '@mui/icons-material/Code'
import { mdxComponents } from '../post/MdxComponents'
import { useRuntimeMdx } from './useRuntimeMdx'
import { useThemeMode } from '@shell/ThemeContext'
import { Banner } from '@shell/Banner'
import { supabase } from '@lib/supabase'
import { useSession } from '@lib/useSession'
import { formatPostDate } from '@core/domain/post'

const TEAL = '#12b886'

// ── 에디터 테마 (module-level 상수 → 안정적 레퍼런스) ────────
// theme prop에 직접 전달해 @uiw/react-codemirror 내장 light 테마를 완전히 대체한다.
const lightEditorTheme = EditorView.theme({
  '&':              { height: '100%', background: '#ffffff', color: '#212529' },
  '&.cm-focused':   { outline: 'none' },
  '.cm-scroller':   { overflow: 'auto', fontFamily: '"JetBrains Mono","Fira Code",monospace', lineHeight: '1.7', fontSize: '14px' },
  '.cm-content':    { padding: '24px 0 200px', caretColor: '#212529' },
  '.cm-line':       { padding: '0 40px' },
  '.cm-cursor':     { borderLeftColor: TEAL },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '.cm-gutters':    { display: 'none' },
  '.cm-selectionBackground':                       { backgroundColor: 'rgba(99,102,241,0.15)' },
  '&.cm-focused .cm-selectionBackground':          { backgroundColor: 'rgba(99,102,241,0.15)' },
})

const darkEditorTheme = EditorView.theme({
  '&':              { height: '100%', background: '#1a1a1a', color: '#abb2bf' },
  '&.cm-focused':   { outline: 'none' },
  '.cm-scroller':   { overflow: 'auto', fontFamily: '"JetBrains Mono","Fira Code",monospace', lineHeight: '1.7', fontSize: '14px' },
  '.cm-content':    { padding: '24px 0 200px', caretColor: '#abb2bf' },
  '.cm-line':       { padding: '0 40px', color: '#abb2bf' },
  '.cm-cursor':     { borderLeftColor: TEAL },
  '.cm-activeLine': { backgroundColor: 'transparent' },
  '.cm-gutters':    { display: 'none' },
  '.cm-selectionBackground':                       { backgroundColor: 'rgba(99,102,241,0.3)' },
  '&.cm-focused .cm-selectionBackground':          { backgroundColor: 'rgba(99,102,241,0.3)' },
}, { dark: true })

const PALETTE = [
  { label: '색상 제거', value: '' },
  { label: '빨강',     value: '#ef4444' },
  { label: '주황',     value: '#f97316' },
  { label: '노랑',     value: '#ca8a04' },
  { label: '초록',     value: '#16a34a' },
  { label: '하늘',     value: '#0ea5e9' },
  { label: '파랑',     value: '#3b82f6' },
  { label: '남색',     value: '#6366f1' },
  { label: '보라',     value: '#8b5cf6' },
  { label: '분홍',     value: '#ec4899' },
]

// ── 편집 대상 ────────────────────────────────────────────────
interface MdxParts {
  title: string; tag: string; date: string
  slug: string; imageUrl: string; excerpt: string; body: string
}

/** 제목 → URL slug (한글 유지). 비면 시간 기반 */
const toSlug = (title: string) =>
  title.trim().toLowerCase()
    .replace(/[^\w가-힣\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '') || `post-${Date.now()}`

/** 본문 MDX → 목록용 요약 (마크다운 기호·코드블록 제거, 120자) */
const toExcerpt = (body: string) =>
  body.replace(/```[\s\S]*?```/g, '')
    .replace(/[#>*_`~|[\]()!-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)

const DEFAULT_PARTS: MdxParts = {
  title: '', tag: '',
  date: new Date().toLocaleDateString('ko', { year: '2-digit', month: '2-digit', day: '2-digit' }),
  slug: 'new-post',
  imageUrl: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=1200&q=80',
  excerpt: '', body: '',
}

// ── 이미지 유틸 ──────────────────────────────────────────────
let _imgSeq = 0
const newImgId = () => `img-${Date.now()}-${_imgSeq++}`

/** 에디터 커서 위치에 <img> 삽입 */
function insertImageMd(view: EditorView, src: string, alt = 'image') {
  const id  = newImgId()
  const { from } = view.state.selection.main
  view.dispatch({
    changes: { from, to: from, insert: `\n<img src="${src}" alt="${alt}" width="100%" data-img-id="${id}" />\n` },
  })
  view.focus()
}

/** body 문자열에서 data-img-id 가 일치하는 <img> 의 width 를 업데이트 */
function updateImageWidth(body: string, imgId: string, newWidth: number): string {
  return body.replace(/(<img\s[^>]*?>)/gs, (match) => {
    if (!match.includes(`data-img-id="${imgId}"`)) return match
    if (/\bwidth="[^"]*"/.test(match))
      return match.replace(/\bwidth="[^"]*"/, `width="${newWidth}px"`)
    return match.replace('<img', `<img width="${newWidth}px"`)
  })
}

// ── 드래그 리사이저 (splitPane) ──────────────────────────────
function useSplitResize(init = 50) {
  const [pct, setPct] = useState(init)
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const onDown = useCallback(() => { dragging.current = true }, [])
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !ref.current) return
      const r = ref.current.getBoundingClientRect()
      setPct(Math.max(30, Math.min(70, ((e.clientX - r.left) / r.width) * 100)))
    }
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [])
  return { pct, ref, onDown }
}

// ── 마크다운 포맷 삽입 ────────────────────────────────────────
function fmtInline(v: EditorView, before: string, after: string) {
  const { from, to } = v.state.selection.main
  const sel = v.state.sliceDoc(from, to) || 'text'
  v.dispatch({
    changes: { from, to, insert: `${before}${sel}${after}` },
    selection: { anchor: from + before.length, head: from + before.length + sel.length },
  })
  v.focus()
}
function fmtLine(v: EditorView, prefix: string) {
  const { from } = v.state.selection.main
  const line = v.state.doc.lineAt(from)
  v.dispatch({ changes: { from: line.from, to: line.from, insert: prefix } })
  v.focus()
}
function fmtBlock(v: EditorView) {
  const { from, to } = v.state.selection.main
  const sel = v.state.sliceDoc(from, to) || 'code'
  v.dispatch({ changes: { from, to, insert: `\`\`\`\n${sel}\n\`\`\`` } })
  v.focus()
}

// ── 리사이저블 이미지 (preview 전용) ────────────────────────
interface ResizableImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  'data-img-id'?: string
  onResize: (id: string, width: number) => void
}

function ResizableImg({
  src, alt, width: widthProp, 'data-img-id': imgId, onResize,
}: ResizableImgProps) {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const dragging  = useRef(false)
  const startX    = useRef(0)
  const startW    = useRef(0)
  const [hovered, setHovered] = useState(false)
  const [width, setWidth]     = useState<number | null>(() => {
    if (typeof widthProp === 'number') return widthProp
    if (typeof widthProp === 'string' && widthProp.endsWith('px'))
      return parseInt(widthProp, 10)
    return null // null = 100%
  })

  const onHandleDown = useCallback((e: React.MouseEvent) => {
    if (!imgId) return
    e.preventDefault(); e.stopPropagation()
    dragging.current = true
    startX.current   = e.clientX
    startW.current   = wrapRef.current?.offsetWidth ?? 500

    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setWidth(Math.max(80, Math.min(900, startW.current + (e.clientX - startX.current))))
    }
    const onUp = (e: MouseEvent) => {
      dragging.current = false
      const finalW = Math.max(80, Math.min(900, startW.current + (e.clientX - startX.current)))
      setWidth(finalW)
      onResize(imgId!, finalW)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [imgId, onResize])

  return (
    <Box
      ref={wrapRef}
      sx={{
        position: 'relative', display: 'inline-block',
        width: width ? `${width}px` : '100%',
        maxWidth: '100%', my: 2, lineHeight: 0,
        outline: hovered ? '2px solid #6366f1' : '2px solid transparent',
        borderRadius: '8px', transition: 'outline 0.15s',
      }}
      onMouseEnter={() => setIsHoveredTrue(setHovered)}
      onMouseLeave={() => setHovered(false)}
    >
      <Box component="img" src={src} alt={alt ?? ''} sx={{ width: '100%', display: 'block', borderRadius: '8px' }} />

      {/* 크기 라벨 */}
      {hovered && (
        <Box sx={{ position: 'absolute', top: 6, left: 6, bgcolor: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 11, px: 0.75, py: 0.25, borderRadius: '4px', fontFamily: 'monospace', pointerEvents: 'none' }}>
          {width ? `${width}px` : '100%'}
        </Box>
      )}

      {/* 리사이즈 핸들 (우측 하단) */}
      {hovered && imgId && (
        <Box
          onMouseDown={onHandleDown}
          title="드래그하여 크기 조절"
          sx={{
            position: 'absolute', bottom: 6, right: 6,
            width: 18, height: 18, bgcolor: '#6366f1', borderRadius: '4px',
            cursor: 'se-resize', display: 'flex', alignItems: 'center', justifyContent: 'center',
            '&:hover': { bgcolor: '#4f46e5' },
          }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 8L8 2M5 8L8 5M8 8V8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </Box>
      )}
    </Box>
  )
}
// setState helper to avoid inline arrow in onMouseEnter
function setIsHoveredTrue(set: React.Dispatch<React.SetStateAction<boolean>>) { set(true) }

// ── 툴바 버튼 ────────────────────────────────────────────────
function TbBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <Tooltip title={title} placement="top">
      <Box component="button" onClick={onClick} sx={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 32, height: 32, px: 0.5, bgcolor: 'transparent', border: 'none',
        borderRadius: '4px', cursor: 'pointer', color: 'text.secondary',
        transition: 'background 0.12s, color 0.12s',
        '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
      }}>
        {children}
      </Box>
    </Tooltip>
  )
}

function Sep() {
  return <Box sx={{ width: '1px', height: 20, bgcolor: 'divider', mx: 0.5, flexShrink: 0 }} />
}

// ── 프리뷰 패널 (memo: body 타이핑 중 불필요한 재렌더링 차단) ──────
const PreviewPanel = memo(function PreviewPanel({
  title,
  Component,
  error,
  previewComponents,
}: {
  title: string
  Component: React.ComponentType | null
  error: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  previewComponents: Record<string, any>
}) {
  return (
    <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, flexDirection: 'column', overflowY: 'auto', bgcolor: 'background.paper' }}>
      <Box sx={{ maxWidth: 680, mx: 'auto', px: 5, pt: 5, pb: 10, width: '100%' }}>
        <Text variant="h1" sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.02em', color: 'text.primary', mb: 4, whiteSpace: 'pre-wrap', display: 'block' }}>
          {title || <Box component="span" sx={{ color: 'text.disabled' }}>제목 없음</Box>}
        </Text>
        {error && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', border: '1px solid', borderColor: 'error.light', borderRadius: '8px' }}>
            <Text variant="code" sx={{ color: 'error.dark', whiteSpace: 'pre-wrap', display: 'block' }}>{error}</Text>
          </Box>
        )}
        <MDXProvider components={previewComponents}>
          {Component && <Component />}
        </MDXProvider>
      </Box>
    </Box>
  )
})

// ── 메인 ─────────────────────────────────────────────────────
export default function MdxEditor() {
  const { slug }   = useParams<{ slug?: string }>()
  const router     = useRouter()
  const { mode } = useThemeMode()
  const isDark = mode === 'dark'
  const [parts, setParts]         = useState<MdxParts>(DEFAULT_PARTS)
  const [loading, setLoading]     = useState(!!slug)
  const [postId, setPostId]       = useState<number | null>(null)
  const [published, setPublished] = useState(false)
  const [saving, setSaving]       = useState<'draft' | 'publish' | null>(null)
  const [saveMsg, setSaveMsg]     = useState<{ ok: boolean; text: string } | null>(null)
  const pathname = usePathname()
  const { isAdmin, ready: sessionReady } = useSession()

  // 관리자 아니면 → 로그인 페이지로
  useEffect(() => {
    if (sessionReady && !isAdmin) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [sessionReady, isAdmin, router, pathname])
  const [isDragOver, setDragOver] = useState(false)
  const [selPicker, setSelPicker] = useState<{
    x: number; y: number; from: number; to: number
  } | null>(null)
  const viewRef = useRef<EditorView | null>(null)
  const { pct, ref: containerRef, onDown } = useSplitResize(50)

  // 포스트 로드 (Supabase)
  useEffect(() => {
    if (!slug) return
    let cancelled = false
    supabase.from('posts').select('*').eq('slug', slug).maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) console.error(error)
        if (data) {
          setParts({
            title: data.title, tag: data.tag, date: formatPostDate(data.published_at),
            slug: data.slug, imageUrl: data.image_url, excerpt: data.excerpt, body: data.body,
          })
          setPostId(data.id)
          setPublished(data.published)
        }
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [slug])

  const set = useCallback(
    <K extends keyof MdxParts,>(k: K, v: MdxParts[K]) => setParts(p => ({ ...p, [k]: v })),
    []
  )

  // ── 이미지 드래그드롭 ───────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (Array.from(e.dataTransfer.items).some(i => i.type.startsWith('image/'))) {
      e.preventDefault(); setDragOver(true)
    }
  }, [])
  const handleDragLeave = useCallback(() => setDragOver(false), [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (!files.length) return
    e.preventDefault(); setDragOver(false)
    const view = viewRef.current; if (!view) return
    files.forEach(f => insertImageMd(view, URL.createObjectURL(f), f.name))
  }, [])

  // ── 이미지 붙여넣기 (CodeMirror Extension) ─────────────────
  const pasteImgExt = useMemo(() =>
    EditorView.domEventHandlers({
      paste: (e, view) => {
        const items = Array.from(e.clipboardData?.items ?? [])
        const img   = items.find(i => i.type.startsWith('image/'))
        if (!img) return false
        e.preventDefault()
        const file = img.getAsFile(); if (!file) return false
        insertImageMd(view, URL.createObjectURL(file), 'pasted-image')
        return true
      },
    }),
  [])

  // ── 텍스트 선택 → 색상 피커 위치 계산 ─────────────────────
  const colorExt = useMemo(() =>
    EditorView.updateListener.of((update) => {
      if (!update.selectionSet) return
      const { from, to } = update.state.selection.main
      if (from === to) { setSelPicker(null); return }
      const coords = update.view.coordsAtPos(from)
      if (!coords) return
      setSelPicker({
        x: Math.max(8, Math.min(coords.left, window.innerWidth - 280)),
        y: coords.top,
        from, to,
      })
    }),
  []) // setSelPicker은 useState 세터 → 항상 안정적

  // ── 색상 적용 ──────────────────────────────────────────────
  const applyColor = useCallback((color: string) => {
    const view = viewRef.current
    if (!view || !selPicker) return
    const { from, to } = selPicker
    const selected = view.state.sliceDoc(from, to)

    const insert = color
      ? `<span data-color="${color}">${selected}</span>`
      // 색상 제거: 선택 범위 내 color span 을 텍스트만 남김
      : selected.replace(/<span\s+data-color="[^"]*"[^>]*>([\s\S]*?)<\/span>/g, '$1')

    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: from + insert.length },
    })
    setSelPicker(null)
    view.focus()
  }, [selPicker])

  // ── preview 에서 이미지 리사이즈 → body 업데이트 ───────────
  const handleImageResize = useCallback((id: string, width: number) => {
    setParts(p => ({ ...p, body: updateImageWidth(p.body, id, width) }))
  }, [])

  const previewComponents = useMemo(() => ({
    ...mdxComponents,
    img: (props: React.ImgHTMLAttributes<HTMLImageElement> & { 'data-img-id'?: string }) => (
      <ResizableImg {...props} onResize={handleImageResize} />
    ),
  }), [handleImageResize])

  // MDX 컴파일 - 50ms 디바운스: 빠른 타이핑 중 컴파일 스킵, 살짝 멈추면 즉시 반영
  const { Component, error } = useRuntimeMdx(parts.body, 50)

  // 저장: publish=false 임시저장, true 출간
  const save = async (publish: boolean) => {
    if (!parts.title.trim()) {
      setSaveMsg({ ok: false, text: '제목을 입력하세요.' })
      return
    }
    setSaving(publish ? 'publish' : 'draft')
    setSaveMsg(null)

    const row = {
      title: parts.title.trim(),
      tag: parts.tag.trim(),
      body: parts.body,
      image_url: parts.imageUrl,
      excerpt: parts.excerpt || toExcerpt(parts.body),
      // 출간한 글을 임시저장해도 비공개로 되돌리지 않음
      published: publish || published,
    }
    const { data, error } = postId
      ? await supabase.from('posts').update(row).eq('id', postId).select('id, slug, published').single()
      : await supabase.from('posts').insert({ ...row, slug: toSlug(parts.title) }).select('id, slug, published').single()

    setSaving(null)
    if (error) {
      console.error(error)
      setSaveMsg({
        ok: false,
        text: error.code === '23505' ? '같은 주소(slug)의 글이 이미 있습니다. 제목을 바꿔주세요.' : `저장 실패: ${error.message}`,
      })
      return
    }

    setPostId(data.id)
    setPublished(data.published)
    if (publish) {
      router.push(`/posts/${data.slug}`)
    } else {
      setSaveMsg({ ok: true, text: '임시저장됨' })
      if (!slug) router.replace(`/editor/${data.slug}`)
    }
  }

  // CodeMirror 익스텐션
  const cmExts = useMemo(() => [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    pasteImgExt,
    colorExt,
    // 다크모드: One Dark 구문 색상만 사용 (배경은 theme prop으로 직접 지정)
    ...(isDark ? [syntaxHighlighting(oneDarkHighlightStyle)] : []),
    EditorView.lineWrapping,
  ], [pasteImgExt, colorExt, isDark])

  // 포맷 핸들러
  const fmt = useCallback((type: string) => {
    const v = viewRef.current; if (!v) return
    const map: Record<string, () => void> = {
      h1: () => fmtLine(v, '# '),    h2: () => fmtLine(v, '## '),
      h3: () => fmtLine(v, '### '),  h4: () => fmtLine(v, '#### '),
      bold:   () => fmtInline(v, '**', '**'),
      italic: () => fmtInline(v, '*', '*'),
      strike: () => fmtInline(v, '~~', '~~'),
      quote:  () => fmtLine(v, '> '),
      link:   () => fmtInline(v, '[', '](url)'),
      image:  () => fmtInline(v, '![alt](', ')'),
      code:   () => fmtBlock(v),
    }
    map[type]?.()
  }, [])

  if (loading) return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper' }}>
      <CircularProgress size={32} sx={{ color: TEAL }} />
    </Box>
  )

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', overflow: 'hidden' }}>

      {/* ── 에디터 Banner ── */}
      <Banner />

      <Box ref={containerRef} sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── 에디터 패널 ── */}
        <Box sx={{
          width: { xs: '100%', md: `${pct}%` }, flexShrink: 0,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRight: { md: '1px solid' },
          borderRightColor: { md: 'divider' },
          position: 'relative',
        }}>
          <Box sx={{ px: 5, pt: 5, flexShrink: 0 }}>
            <InputBase
              value={parts.title}
              onChange={e => set('title', e.target.value)}
              placeholder="제목을 입력하세요"
              fullWidth multiline
              sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '-0.02em', color: 'text.primary', '& textarea': { p: 0 } }}
            />
            <Box sx={{ mt: 2, mb: 2.5, height: 5, width: 56, bgcolor: TEAL, borderRadius: '3px' }} />
            <InputBase
              value={parts.tag}
              onChange={e => set('tag', e.target.value)}
              placeholder="태그를 입력하세요"
              fullWidth
              sx={{ fontSize: '0.9375rem', color: 'text.secondary', mb: 1.5, '& input': { p: 0 } }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, py: 0.75, borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
              {(['h1','h2','h3','h4'] as const).map(h => (
                <TbBtn key={h} onClick={() => fmt(h)} title={`제목 ${h[1]}`}>
                  <span style={{ fontFamily: 'serif', fontWeight: 700, fontSize: 13 }}>H<sub style={{ fontSize: 9 }}>{h[1]}</sub></span>
                </TbBtn>
              ))}
              <Sep />
              <TbBtn onClick={() => fmt('bold')}   title="굵게"><FormatBoldIcon sx={{ fontSize: 18 }} /></TbBtn>
              <TbBtn onClick={() => fmt('italic')} title="기울임"><FormatItalicIcon sx={{ fontSize: 18 }} /></TbBtn>
              <TbBtn onClick={() => fmt('strike')} title="취소선"><FormatStrikethroughIcon sx={{ fontSize: 18 }} /></TbBtn>
              <Sep />
              <TbBtn onClick={() => fmt('quote')}  title="인용구"><FormatQuoteIcon sx={{ fontSize: 18 }} /></TbBtn>
              <TbBtn onClick={() => fmt('link')}   title="링크 삽입"><InsertLinkIcon sx={{ fontSize: 18 }} /></TbBtn>
              <TbBtn onClick={() => fmt('image')}  title="이미지 삽입"><InsertPhotoIcon sx={{ fontSize: 18 }} /></TbBtn>
              <TbBtn onClick={() => fmt('code')}   title="코드 블록"><CodeIcon sx={{ fontSize: 18 }} /></TbBtn>
            </Box>
          </Box>

          {/* 본문 에디터 + 드래그드롭 */}
          <Box
            sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CodeMirror
              value={parts.body}
              height="100%"
              onChange={v => set('body', v)}
              onCreateEditor={view => { viewRef.current = view }}
              theme={isDark ? darkEditorTheme : lightEditorTheme}
              extensions={cmExts}
              basicSetup={{ lineNumbers: false, foldGutter: false, highlightActiveLine: false, bracketMatching: true, closeBrackets: true, indentOnInput: true, tabSize: 2 }}
              style={{ height: '100%', overflow: 'hidden' }}
            />

            {/* 드래그오버 오버레이 */}
            {isDragOver && (
              <Box sx={{
                position: 'absolute', inset: 0, zIndex: 10,
                bgcolor: 'rgba(99,102,241,0.08)',
                border: `2px dashed #6366f1`,
                borderRadius: '4px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 1, pointerEvents: 'none',
              }}>
                <InsertPhotoIcon sx={{ fontSize: 36, color: '#6366f1' }} />
                <Text variant="body1" sx={{ color: '#6366f1', fontWeight: 600 }}>
                  이미지를 놓으세요
                </Text>
              </Box>
            )}
          </Box>
        </Box>

        {/* ── 글자 색상 피커 팝업 (position: fixed) ── */}
        {selPicker && (
          <Box
            onMouseDown={e => e.preventDefault()} // 에디터 selection 유지
            sx={{
              position: 'fixed',
              left: selPicker.x,
              top: selPicker.y - 52,
              zIndex: 3000,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '10px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
              px: '10px',
              py: '7px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {PALETTE.map(({ label, value }) => (
              <Tooltip key={value || 'remove'} title={label} placement="top">
                <Box
                  onClick={() => applyColor(value)}
                  sx={{
                    width: 20, height: 20,
                    borderRadius: '50%',
                    bgcolor: value || 'transparent',
                    border: `2px solid ${value ? `${value}55` : '#ced4da'}`,
                    cursor: 'pointer',
                    flexShrink: 0,
                    position: 'relative',
                    transition: 'transform 0.1s, box-shadow 0.1s',
                    '&:hover': {
                      transform: 'scale(1.3)',
                      boxShadow: `0 0 0 2px ${value || '#ced4da'}`,
                    },
                  }}
                >
                  {!value && (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#adb5bd', lineHeight: 1 }}>✕</Box>
                  )}
                </Box>
              </Tooltip>
            ))}
          </Box>
        )}

        {/* 드래그 핸들 */}
        <Box onMouseDown={onDown} sx={{ display: { xs: 'none', md: 'block' }, width: 4, flexShrink: 0, cursor: 'col-resize', bgcolor: 'transparent', transition: 'background 0.15s', '&:hover': { bgcolor: 'divider' }, '&:active': { bgcolor: TEAL } }} />

        {/* ── 프리뷰 패널 ── */}
        <PreviewPanel
          title={parts.title}
          Component={Component}
          error={error}
          previewComponents={previewComponents}
        />
      </Box>

      {/* ── 하단 바 ── */}
      <Box sx={{ flexShrink: 0, height: 56, display: 'flex', alignItems: 'center', px: 3, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Button variant="ghost" startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />} onClick={() => router.back()} sx={{ fontSize: 14 }}>나가기</Button>
        <Box sx={{ flex: 1 }} />
        {saveMsg && (
          <Text variant="body2" role="status" sx={{ mr: 2, color: saveMsg.ok ? 'text.secondary' : 'error.main' }}>{saveMsg.text}</Text>
        )}
        {!published && (
          <Button variant="text" onClick={() => save(false)} loading={saving === 'draft'} disabled={!!saving} sx={{ color: TEAL, fontWeight: 600, fontSize: 14, mr: 1, '&:hover': { bgcolor: `${TEAL}14` } }}>임시저장</Button>
        )}
        <Button variant="contained" onClick={() => save(true)} loading={saving === 'publish'} disabled={!!saving} sx={{ bgcolor: TEAL, color: '#fff', fontWeight: 600, fontSize: 14, borderRadius: '20px', px: 3, boxShadow: 'none', '&:hover': { bgcolor: '#0ca678', boxShadow: 'none' } }}>{published ? '수정하기' : '출간하기'}</Button>
      </Box>
    </Box>
  )
}
