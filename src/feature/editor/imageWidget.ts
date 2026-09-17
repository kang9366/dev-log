import { StateField, type EditorState, type Range } from '@codemirror/state'
import { Decoration, EditorView, WidgetType, type DecorationSet } from '@codemirror/view'
import { ensureSyntaxTree, syntaxTree } from '@codemirror/language'

/**
 * 에디터 안에서 이미지 줄(<img … /> 또는 ![alt](url))을 실제 이미지로 보여줌.
 * 모서리 핸들로 크기 조절 → width 속성을 문서에 반영. 줄 전체가 이미지일 때만 적용.
 */

const HTML_IMG = /^\s*<img\b[^>]*?\/?>\s*$/i
const MD_IMG = /^\s*!\[([^\]]*)\]\(\s*<?([^\s)>]+)>?(?:\s+"[^"]*")?\s*\)\s*$/

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? null

/** 이미지 줄 → 표시 정보. 이미지 줄이 아니면 null */
export function parseImageLine(line: string): { src: string; alt: string; width: string | null } | null {
  if (HTML_IMG.test(line)) {
    const src = attr(line, 'src')
    return src ? { src, alt: attr(line, 'alt') ?? '', width: attr(line, 'width') } : null
  }
  const md = line.match(MD_IMG)
  return md ? { src: md[2], alt: md[1], width: null } : null
}

/** 너비 반영한 이미지 줄. 마크다운 이미지는 width 를 못 담아 <img> 로 바꿈 */
export function withWidth(line: string, width: number): string {
  const w = `width="${width}px"`
  if (HTML_IMG.test(line)) {
    return /\bwidth="[^"]*"/.test(line) ? line.replace(/\bwidth="[^"]*"/, w) : line.replace(/<img\b/i, `<img ${w}`)
  }
  const { src, alt } = parseImageLine(line)!
  return `<img src="${src}" alt="${alt}" ${w} />`
}

function rangeOf(view: EditorView, dom: HTMLElement) {
  const from = view.posAtDOM(dom)
  let to = -1
  view.state.field(imageField).between(from, from, (f, t) => { if (f === from) to = t })
  return to < 0 ? null : { from, to }
}

class ImageWidget extends WidgetType {
  readonly src: string
  readonly alt: string
  readonly width: string | null
  constructor(src: string, alt: string, width: string | null) {
    super()
    this.src = src
    this.alt = alt
    this.width = width
  }

  eq(o: ImageWidget) { return o.src === this.src && o.alt === this.alt && o.width === this.width }

  toDOM(view: EditorView) {
    const wrap = document.createElement('div')
    wrap.className = 'cm-md-img'

    const frame = document.createElement('div')
    frame.className = 'cm-md-img-frame'
    frame.style.width = this.width ?? '100%'

    const img = document.createElement('img')
    img.src = this.src
    img.alt = this.alt
    img.draggable = false

    const size = document.createElement('span')
    size.className = 'cm-md-img-size'

    const del = document.createElement('button')
    del.type = 'button'
    del.className = 'cm-md-img-del'
    del.setAttribute('aria-label', '이미지 삭제')
    del.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
    del.addEventListener('click', () => {
      const range = rangeOf(view, wrap)
      if (!range) return
      // 줄바꿈까지 지워 빈 줄이 남지 않게
      const to = Math.min(range.to + 1, view.state.doc.length)
      view.dispatch({ changes: { from: range.from, to } })
      view.focus()
    })

    const handle = document.createElement('span')
    handle.className = 'cm-md-img-handle'
    handle.setAttribute('aria-hidden', 'true')
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault()
      const startX = e.clientX, startW = frame.offsetWidth
      const maxW = wrap.clientWidth - parseFloat(getComputedStyle(wrap).paddingLeft) * 2
      const widthAt = (x: number) => Math.round(Math.max(80, Math.min(maxW, startW + x - startX)))
      wrap.dataset.resizing = ''
      const onMove = (ev: MouseEvent) => {
        const w = widthAt(ev.clientX)
        frame.style.width = `${w}px`
        size.textContent = `${w}px`
      }
      const onUp = (ev: MouseEvent) => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        delete wrap.dataset.resizing
        const range = rangeOf(view, wrap)
        if (range) view.dispatch({ changes: { ...range, insert: withWidth(view.state.sliceDoc(range.from, range.to), widthAt(ev.clientX)) } })
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })

    frame.append(img, size, del, handle)
    wrap.append(frame)
    return wrap
  }
}

const CODE_NODES = new Set(['FencedCode', 'CodeBlock', 'HTMLBlock', 'CommentBlock'])

function buildDecorations(state: EditorState): DecorationSet {
  const tree = ensureSyntaxTree(state, state.doc.length, 200) ?? syntaxTree(state)
  const decos: Range<Decoration>[] = []
  for (let i = 1; i <= state.doc.lines; i++) {
    const line = state.doc.line(i)
    const info = parseImageLine(line.text)
    if (!info) continue
    // 코드 블록 안 예시 코드는 그대로 둠 (HTMLBlock 은 <img> 줄 자체라 제외하지 않음)
    let inCode = false
    for (let n: ReturnType<typeof tree.resolveInner> | null = tree.resolveInner(line.from, 1); n; n = n.parent) {
      if (CODE_NODES.has(n.name) && n.name !== 'HTMLBlock') { inCode = true; break }
    }
    if (inCode) continue
    decos.push(Decoration.replace({ widget: new ImageWidget(info.src, info.alt, info.width), block: true }).range(line.from, line.to))
  }
  return Decoration.set(decos)
}

const imageField = StateField.define<DecorationSet>({
  create: buildDecorations,
  update: (decos, tr) =>
    tr.docChanged || syntaxTree(tr.startState) !== syntaxTree(tr.state) ? buildDecorations(tr.state) : decos,
  provide: (f) => [
    EditorView.decorations.from(f),
    // 커서 이동·Backspace 가 이미지 줄을 한 덩어리로 다룸
    EditorView.atomicRanges.of((view) => view.state.field(f)),
  ],
})

const imageTheme = EditorView.baseTheme({
  '.cm-md-img': { padding: '8px 40px' },
  '.cm-md-img-frame': { position: 'relative', maxWidth: '100%', borderRadius: '8px', outline: '2px solid transparent', transition: 'outline-color 0.15s' },
  '.cm-md-img-frame:hover, .cm-md-img[data-resizing] .cm-md-img-frame': { outlineColor: 'var(--primary)' },
  '.cm-md-img-frame img': { display: 'block', width: '100%', borderRadius: '8px' },
  '.cm-md-img-handle': {
    position: 'absolute', right: '-6px', bottom: '-6px', width: '12px', height: '12px', borderRadius: '3px',
    border: '2px solid var(--card)', background: 'var(--primary)', cursor: 'nwse-resize', opacity: '0',
  },
  '.cm-md-img-del': {
    position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '26px', height: '26px', padding: '0', border: '0', borderRadius: '50%',
    background: 'rgba(0,0,0,0.55)', color: '#fff', opacity: '0',
  },
  '.cm-md-img-del:hover': { background: 'var(--destructive)' },
  '.cm-md-img-frame:hover .cm-md-img-handle, .cm-md-img-frame:hover .cm-md-img-del, .cm-md-img[data-resizing] .cm-md-img-handle': { opacity: '1' },
  '.cm-md-img-size': {
    position: 'absolute', top: '8px', left: '8px', padding: '2px 6px', borderRadius: '4px',
    background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '11px', display: 'none',
  },
  '.cm-md-img[data-resizing] .cm-md-img-size': { display: 'block' },
})

export const imageEditor = [imageField, imageTheme]
