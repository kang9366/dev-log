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
import {
  ArrowLeft, Bold, Code as CodeIcon, ImageIcon, Italic, Link as LinkIcon,
  FileCode, Loader2, Quote, Strikethrough, Table,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { mdxComponents } from '../post/MdxComponents'
import { useRuntimeMdx } from './useRuntimeMdx'
import { insertTable, tableEditor } from './tableWidget'
import { imageEditor } from './imageWidget'
import { TagInput } from './TagInput'
import { useThemeMode } from '@shell/ThemeContext'
import { Banner } from '@shell/Banner'
import { supabase } from '@lib/supabase'
import { useSession } from '@lib/useSession'
import { Typography } from '@/components/ui/typography'

// ── 에디터 테마 (module-level 상수 → 안정적 레퍼런스) ────────
// theme prop에 직접 전달해 @uiw/react-codemirror 내장 light 테마를 완전히 대체한다.
const lightEditorTheme = EditorView.theme({
  '&':              { height: '100%', background: '#ffffff', color: '#212529' },
  '&.cm-focused':   { outline: 'none' },
  '.cm-scroller':   { overflow: 'auto', fontFamily: '"JetBrains Mono","Fira Code",monospace', lineHeight: '1.7', fontSize: '14px' },
  '.cm-content':    { padding: '24px 0 200px', caretColor: '#212529' },
  '.cm-line':       { padding: '0 40px' },
  '.cm-cursor':     { borderLeftColor: 'var(--primary)' },
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
  '.cm-cursor':     { borderLeftColor: 'var(--primary)' },
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
  html: string  // 글의 HTML 버전 ('' = 없음)
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

/** 오늘 날짜를 'YYYY-MM-DD' 로. toISOString() 은 UTC 기준이라 새벽에 하루 밀린다 */
const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DEFAULT_PARTS: MdxParts = {
  title: '', tag: '',
  date: todayIso(),
  slug: 'new-post',
  imageUrl: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=1200&q=80',
  excerpt: '', body: '', html: '',
}

// ── 이미지 유틸 ──────────────────────────────────────────────
/** 커서 줄 끝에 이미지 줄 삽입 (줄 중간을 자르지 않음). 에디터에선 imageWidget 이 이미지로 보여줌 */
function insertImageMd(view: EditorView, src: string, alt = 'image') {
  const line = view.state.doc.lineAt(view.state.selection.main.from)
  const tag  = `<img src="${src}" alt="${alt.replace(/"/g, '')}" width="100%" />`
  const insert = `${line.length ? '\n' : ''}${tag}\n`
  view.dispatch({ changes: { from: line.to, insert }, selection: { anchor: line.to + insert.length } })
  view.focus()
}

// ── 이미지 업로드 (Supabase Storage covers 버킷, 관리자만 insert 가능) ──
// 표지(cover/)와 본문 이미지(body/)를 같은 버킷에 폴더로 나눠 저장
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const IMAGE_MAX_BYTES = 5 * 1024 * 1024 // 버킷 file_size_limit 과 동일

async function uploadImage(file: File, folder: 'cover' | 'body'): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('JPG·PNG·WebP·GIF·AVIF 이미지만 올릴 수 있습니다.')
  if (file.size > IMAGE_MAX_BYTES) throw new Error('5MB 이하 이미지만 올릴 수 있습니다.')
  // 매번 새 파일명 → 덮어쓰기 없음, CDN 캐시 길게
  // ponytail: 교체·삭제한 이미지 파일은 버킷에 남음. 용량 문제 되면 저장 시 안 쓰는 경로 정리 추가
  const path = `${folder}/${crypto.randomUUID()}.${file.name.split('.').pop()?.toLowerCase() || 'img'}`
  const { error } = await supabase.storage.from('covers').upload(path, file, { contentType: file.type, cacheControl: '31536000' })
  if (error) throw new Error(`업로드 실패: ${error.message}`)
  return supabase.storage.from('covers').getPublicUrl(path).data.publicUrl
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

// ── 툴바 버튼 ────────────────────────────────────────────────
function TbBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded px-1 text-muted-foreground transition-colors hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.08] [&_svg]:size-[18px]"
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border" />
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
    <div className="hidden flex-1 flex-col overflow-y-auto bg-card md:flex">
      <div className="mx-auto w-full max-w-[680px] px-10 pt-10 pb-20">
        <Typography variant="h1" className="mb-8 block whitespace-pre-wrap">
          {title || <span className="text-neutral-400">제목 없음</span>}
        </Typography>
        {error && (
          <div role="alert" className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
            <Typography variant="code" color="destructive" className="block whitespace-pre-wrap">{error}</Typography>
          </div>
        )}
        <MDXProvider components={previewComponents}>
          {Component && <Component />}
        </MDXProvider>
      </div>
    </div>
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
  const [coverUploading, setCoverUploading] = useState(false)
  const [infoError, setInfoError]           = useState<string | null>(null) // 표지·HTML 업로드 오류
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
            title: data.title, tag: data.tag, date: data.published_at?.slice(0, 10) ?? todayIso(),
            slug: data.slug, imageUrl: data.image_url, excerpt: data.excerpt, body: data.body, html: data.html ?? '',
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

  const handleCoverFile = useCallback(async (file: File | undefined) => {
    if (!file) return
    setInfoError(null)
    setCoverUploading(true)
    try {
      set('imageUrl', await uploadImage(file, 'cover'))
    } catch (e) {
      setInfoError((e as Error).message)
    } finally {
      setCoverUploading(false)
    }
  }, [set])

  // 글의 HTML 버전: 파일 내용을 그대로 저장 (posts.html). 글 페이지에서 MDX ⇄ HTML 전환
  const htmlInputRef = useRef<HTMLInputElement>(null)
  const handleHtmlFile = useCallback(async (file: File | undefined) => {
    if (!file) return
    setInfoError(null)
    if (!/\.html?$/i.test(file.name)) { setInfoError('.html 파일만 올릴 수 있습니다.'); return }
    if (file.size > 2 * 1024 * 1024) { setInfoError('2MB 이하 HTML 파일만 올릴 수 있습니다.'); return }
    set('html', await file.text())
  }, [set])

  // 본문 이미지: 업로드 후 커서 위치에 <img> 삽입 (툴바·붙여넣기·끌어다 놓기 공통)
  const bodyImageInputRef = useRef<HTMLInputElement>(null)
  const uploadIntoBody = useCallback(async (files: File[]) => {
    const view = viewRef.current
    if (!view || !files.length) return
    setSaveMsg({ ok: true, text: '이미지 업로드 중…' })
    try {
      for (const f of files) insertImageMd(view, await uploadImage(f, 'body'), f.name)
      setSaveMsg(null)
    } catch (e) {
      setSaveMsg({ ok: false, text: (e as Error).message })
    }
  }, [])

  // ── 이미지 드래그드롭 ───────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (Array.from(e.dataTransfer.items).some(i => i.type.startsWith('image/'))) {
      e.preventDefault(); setDragOver(true)
    }
  }, [])
  const handleDragLeave = useCallback(() => setDragOver(false), [])
  const handleDrop = useCallback((e: React.DragEvent) => {
    // 에디터 본문에 떨어뜨린 건 CodeMirror 핸들러가 이미 처리
    if (e.defaultPrevented) { setDragOver(false); return }
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (!files.length) return
    e.preventDefault(); setDragOver(false)
    uploadIntoBody(files)
  }, [uploadIntoBody])

  // ── 이미지 붙여넣기·끌어다 놓기 (CodeMirror Extension) ──────
  // CodeMirror 기본 drop 은 파일을 텍스트로 읽어 넣으므로 이미지면 가로챔
  const pasteImgExt = useMemo(() =>
    EditorView.domEventHandlers({
      drop: (e, view) => {
        const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'))
        if (!files.length) return false
        e.preventDefault()
        setDragOver(false)
        // 떨어뜨린 위치의 줄 뒤에 삽입
        const pos = view.posAtCoords({ x: e.clientX, y: e.clientY })
        if (pos != null) view.dispatch({ selection: { anchor: pos } })
        uploadIntoBody(files)
        return true
      },
      paste: (e) => {
        const items = Array.from(e.clipboardData?.items ?? [])
        const img   = items.find(i => i.type.startsWith('image/'))
        if (!img) return false
        e.preventDefault()
        const file = img.getAsFile(); if (!file) return false
        uploadIntoBody([file])
        return true
      },
    }),
  [uploadIntoBody])

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
      html: parts.html || null,
      published_at: parts.date || todayIso(),
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
    tableEditor,
    imageEditor,
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
      image:  () => bodyImageInputRef.current?.click(),
      code:   () => fmtBlock(v),
      table:  () => insertTable(v),
    }
    map[type]?.()
  }, [])

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-card">
      <Loader2 className="size-8 animate-spin text-primary" aria-label="불러오는 중" />
    </div>
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-card">

      {/* ── 에디터 Banner ── */}
      <Banner />

      <div ref={containerRef} className="flex flex-1 overflow-hidden">

        {/* ── 에디터 패널 ── */}
        <div
          className="relative flex w-full shrink-0 flex-col overflow-hidden md:w-[var(--editor-pct)] md:border-r"
          style={{ '--editor-pct': `${pct}%` } as React.CSSProperties}
        >
          <div className="shrink-0 px-10 pt-10">
            <textarea
              value={parts.title}
              onChange={e => set('title', e.target.value)}
              placeholder="제목을 입력하세요"
              aria-label="제목"
              rows={1}
              className="w-full resize-none bg-transparent p-0 text-h1 outline-none [field-sizing:content] placeholder:text-neutral-400"
            />
            {/* 글 정보 (홈 카드에 쓰임): 표지 · 태그 · 목록 요약 */}
            <div className="mt-5 mb-4 flex gap-4">
              <label
                onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
                onDrop={e => { e.preventDefault(); e.stopPropagation(); handleCoverFile(e.dataTransfer.files[0]) }}
                className="group/cover relative flex aspect-[3/2] w-40 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed text-caption text-neutral-400 transition-colors hover:border-primary hover:text-primary"
              >
                <input
                  type="file"
                  accept={IMAGE_TYPES.join(',')}
                  className="sr-only"
                  aria-label="표지 이미지 업로드"
                  disabled={coverUploading}
                  onChange={e => { handleCoverFile(e.target.files?.[0]); e.target.value = '' }}
                />
                {parts.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={parts.imageUrl} alt="표지 미리보기" className="absolute inset-0 size-full object-cover" />
                )}
                <span className={cn(
                  'relative flex flex-col items-center gap-1 text-center',
                  parts.imageUrl && 'rounded-md bg-black/55 px-2 py-1 text-white opacity-0 transition-opacity group-hover/cover:opacity-100',
                  coverUploading && 'opacity-100',
                )}>
                  {coverUploading ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
                  {coverUploading ? '업로드 중' : parts.imageUrl ? '표지 변경' : '표지 업로드'}
                </span>
              </label>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Label htmlFor="post-tag" className="w-10 shrink-0 text-muted-foreground">태그</Label>
                  <TagInput id="post-tag" value={parts.tag} onChange={tag => set('tag', tag)} />
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="post-date" className="w-10 shrink-0 text-muted-foreground">날짜</Label>
                  <input
                    id="post-date"
                    type="date"
                    value={parts.date}
                    onChange={e => set('date', e.target.value)}
                    className="rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-body2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:[color-scheme:dark]"
                  />
                </div>
                <div className="flex items-start gap-3">
                  <Label htmlFor="excerpt" className="mt-2.5 w-10 shrink-0 text-muted-foreground">요약</Label>
                  <textarea
                    id="excerpt"
                    value={parts.excerpt}
                    onChange={e => set('excerpt', e.target.value)}
                    // 비우면 저장할 때 본문 앞부분으로 자동 생성 → 그 결과를 미리 보여줌
                    placeholder={toExcerpt(parts.body) || '비워두면 본문 앞부분으로 자동 생성'}
                    rows={2}
                    maxLength={200}
                    className="w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-body2 outline-none [field-sizing:content] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="post-html" className="w-10 shrink-0 text-muted-foreground">HTML</Label>
                  <input
                    ref={htmlInputRef}
                    id="post-html"
                    type="file"
                    accept=".html,.htm,text/html"
                    className="sr-only"
                    onChange={e => { handleHtmlFile(e.target.files?.[0]); e.target.value = '' }}
                  />
                  {parts.html ? (
                    <div className="flex min-w-0 items-center gap-1">
                      <FileCode className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                      <Typography variant="body2" className="mr-1">HTML 버전</Typography>
                      <Typography variant="caption" color="muted" className="mr-1 font-mono">{Math.ceil(parts.html.length / 1024)}KB</Typography>
                      <Button variant="ghost" size="sm" onClick={() => htmlInputRef.current?.click()}>교체</Button>
                      <Button variant="ghost" size="sm" onClick={() => set('html', '')} className="text-muted-foreground hover:text-destructive">제거</Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => htmlInputRef.current?.click()}>
                      <FileCode />
                      .html 파일 올리기
                    </Button>
                  )}
                </div>
                {infoError && <Typography variant="caption" color="destructive" role="alert">{infoError}</Typography>}
              </div>
            </div>
            <div role="toolbar" aria-label="서식" className="flex flex-wrap items-center gap-0.5 border-y py-1.5">
              {(['h1','h2','h3','h4'] as const).map(h => (
                <TbBtn key={h} onClick={() => fmt(h)} title={`제목 ${h[1]}`}>
                  <span className="font-serif text-subtitle2 font-bold">H<sub className="text-[0.7em]">{h[1]}</sub></span>
                </TbBtn>
              ))}
              <Sep />
              <TbBtn onClick={() => fmt('bold')}   title="굵게"><Bold /></TbBtn>
              <TbBtn onClick={() => fmt('italic')} title="기울임"><Italic /></TbBtn>
              <TbBtn onClick={() => fmt('strike')} title="취소선"><Strikethrough /></TbBtn>
              <Sep />
              <TbBtn onClick={() => fmt('quote')}  title="인용구"><Quote /></TbBtn>
              <TbBtn onClick={() => fmt('link')}   title="링크 삽입"><LinkIcon /></TbBtn>
              <TbBtn onClick={() => fmt('image')}  title="이미지 삽입"><ImageIcon /></TbBtn>
              <input
                ref={bodyImageInputRef}
                type="file"
                accept={IMAGE_TYPES.join(',')}
                multiple
                className="hidden"
                onChange={e => { uploadIntoBody(Array.from(e.target.files ?? [])); e.target.value = '' }}
              />
              <TbBtn onClick={() => fmt('code')}   title="코드 블록"><CodeIcon /></TbBtn>
              <TbBtn onClick={() => fmt('table')}  title="표 삽입"><Table /></TbBtn>
            </div>
          </div>

          {/* 본문 에디터 + 드래그드롭 */}
          <div
            className="relative flex-1 overflow-hidden"
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
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-primary bg-primary/10">
                <ImageIcon className="size-9 text-primary" />
                <Typography variant="subtitle1" className="font-semibold text-primary">이미지를 놓으세요</Typography>
              </div>
            )}
          </div>
        </div>

        {/* ── 글자 색상 피커 팝업 (position: fixed) ── */}
        {selPicker && (
          <div
            onMouseDown={e => e.preventDefault()} // 에디터 selection 유지
            className="fixed z-[3000] flex items-center gap-[5px] rounded-[10px] border bg-card px-2.5 py-[7px] shadow-[0_4px_20px_rgba(0,0,0,0.18)]"
            style={{ left: selPicker.x, top: selPicker.y - 52 }}
          >
            {PALETTE.map(({ label, value }) => (
              <button
                key={value || 'remove'}
                type="button"
                onClick={() => applyColor(value)}
                title={label}
                aria-label={label}
                className="relative size-5 shrink-0 cursor-pointer rounded-full border-2 transition-[transform,box-shadow] duration-100 hover:scale-[1.3]"
                style={{
                  backgroundColor: value || 'transparent',
                  borderColor: value ? `${value}55` : '#ced4da',
                } as React.CSSProperties}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${value || '#ced4da'}` }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '' }}
              >
                {!value && (
                  <span aria-hidden className="absolute inset-0 flex items-center justify-center text-caption leading-none text-[#adb5bd]">✕</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* 드래그 핸들 */}
        <div
          onMouseDown={onDown}
          role="separator"
          aria-orientation="vertical"
          className="hidden w-1 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-border active:bg-primary md:block"
        />

        {/* ── 프리뷰 패널 ── */}
        <PreviewPanel
          title={parts.title}
          Component={Component}
          error={error}
          previewComponents={mdxComponents}
        />
      </div>

      {/* ── 하단 바 ── */}
      <div className="flex h-14 shrink-0 items-center border-t bg-card px-6">
        <Button variant="ghost" size="md" onClick={() => router.back()}>
          <ArrowLeft />
          나가기
        </Button>
        <div className="flex-1" />
        {saveMsg && (
          <Typography variant="body2" role="status" color={saveMsg.ok ? 'muted' : 'destructive'} className="mr-4">{saveMsg.text}</Typography>
        )}
        {!published && (
          <Button
            variant="ghost"
            size="md"
            onClick={() => save(false)}
            disabled={!!saving}
            className="mr-2 text-primary hover:bg-primary/10 hover:text-primary"
          >
            {saving === 'draft' && <Loader2 className="animate-spin" />}
            임시저장
          </Button>
        )}
        <Button
          size="md"
          onClick={() => save(true)}
          disabled={!!saving}
        >
          {saving === 'publish' && <Loader2 className="animate-spin" />}
          {published ? '수정하기' : '출간하기'}
        </Button>
      </div>
    </div>
  )
}
