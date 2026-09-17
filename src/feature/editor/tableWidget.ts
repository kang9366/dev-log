import { StateField, type EditorState, type Range } from '@codemirror/state'
import { Decoration, EditorView, WidgetType, type DecorationSet } from '@codemirror/view'
import { ensureSyntaxTree, syntaxTree } from '@codemirror/language'

/**
 * 에디터 안의 마크다운 표(GFM)를 편집 가능한 격자로 보여줌.
 * 셀을 고치면 즉시 마크다운으로 직렬화해 문서에 반영 → 프리뷰·저장·undo 그대로 동작.
 */

type Align = '' | 'left' | 'center' | 'right'
interface TableModel { align: Align[]; rows: string[][] } // rows[0] = 헤더

// ── 마크다운 ↔ 모델 ─────────────────────────────────────────
const splitRow = (line: string) =>
  line.trim().replace(/^\|/, '').replace(/(?<!\\)\|$/, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, '|'))

export function parseTable(text: string): TableModel {
  const lines = text.split('\n').filter((l) => l.trim())
  const header = splitRow(lines[0])
  const align = splitRow(lines[1] ?? '').map((d): Align =>
    d.startsWith(':') && d.endsWith(':') ? 'center' : d.endsWith(':') ? 'right' : d.startsWith(':') ? 'left' : '')
  const width = header.length
  const fit = (cells: string[]) => Array.from({ length: width }, (_, i) => cells[i] ?? '')
  return { align: fit(align) as Align[], rows: [header, ...lines.slice(2).map((l) => fit(splitRow(l)))] }
}

const DELIM: Record<Align, string> = { '': '---', left: ':---', center: ':---:', right: '---:' }
const row = (cells: string[]) =>
  `|${cells.map((c) => (c ? ` ${c.replace(/\|/g, '\\|').replace(/\n/g, ' ')} ` : ' ')).join('|')}|`

export function serializeTable({ align, rows }: TableModel) {
  return [row(rows[0]), `| ${align.map((a) => DELIM[a]).join(' | ')} |`, ...rows.slice(1).map(row)].join('\n')
}

// ── 구조 변경 뒤 새로 그려진 표에 포커스 복원 ────────────────
// ponytail: 모듈 전역 1개. 구조 변경은 한 번에 표 하나라 충분
let pendingFocus: { r: number; c: number } | null = null

/** 위젯이 차지한 문서 범위 */
function rangeOf(view: EditorView, dom: HTMLElement) {
  const from = view.posAtDOM(dom)
  let to = -1
  view.state.field(tableField).between(from, from, (f, t) => { if (f === from) to = t })
  return to < 0 ? null : { from, to }
}

/** 격자 DOM → 모델. 셀 비교용으로 직렬화·파싱 뒤와 같은 모양(trim, 줄바꿈→공백)으로 맞춤 */
function readTable(wrap: HTMLElement, normalize = false): TableModel {
  const table = wrap.querySelector('table')!
  return {
    align: JSON.parse(wrap.dataset.align!),
    rows: [...table.rows].map((tr) => [...tr.querySelectorAll('textarea')].map((t) =>
      normalize ? t.value.replace(/\n/g, ' ').trim() : t.value)),
  }
}

function commit(view: EditorView, dom: HTMLElement, model: TableModel, focus?: { r: number; c: number }) {
  const range = rangeOf(view, dom)
  if (!range) return
  if (focus) pendingFocus = focus
  view.dispatch({ changes: { ...range, insert: serializeTable(model) } })
}

class TableWidget extends WidgetType {
  readonly model: TableModel
  constructor(model: TableModel) { super(); this.model = model }

  // 셀 타이핑으로 다시 만들어진 위젯이 같은 내용이면 DOM 재사용 → 포커스 유지
  eq(other: TableWidget) { return JSON.stringify(other.model) === JSON.stringify(this.model) }

  // 셀 타이핑 → 문서 변경 → 새 위젯. 격자 DOM 이 이미 그 내용이면 그대로 재사용 (포커스·한글 조합 유지)
  updateDOM(dom: HTMLElement) { return JSON.stringify(readTable(dom, true)) === JSON.stringify(this.model) }

  toDOM(view: EditorView) {
    const wrap = document.createElement('div')
    wrap.className = 'cm-md-table'
    wrap.dataset.align = JSON.stringify(this.model.align)
    // 현재 셀 = 포커스된 textarea (버튼은 mousedown 막아 포커스 유지)
    const current = () => {
      const a = document.activeElement as HTMLElement | null
      return a && wrap.contains(a) && a.dataset.r ? { r: Number(a.dataset.r), c: Number(a.dataset.c) } : { r: 0, c: 0 }
    }
    // DOM 이 재사용돼도 옛 위젯 값에 묶이지 않게 항상 DOM 에서 읽음
    const read = () => readTable(wrap)

    const table = document.createElement('table')
    this.model.rows.forEach((cells, r) => {
      const tr = table.insertRow()
      cells.forEach((value, c) => {
        const cell = document.createElement(r === 0 ? 'th' : 'td')
        const ta = document.createElement('textarea')
        ta.rows = 1
        ta.value = value
        ta.spellcheck = false
        ta.dataset.r = String(r)
        ta.dataset.c = String(c)
        ta.placeholder = r === 0 ? '제목' : ''
        ta.style.textAlign = this.model.align[c] || 'left'
        ta.setAttribute('aria-label', `${r === 0 ? '헤더' : `${r}행`} ${c + 1}열`)
        cell.append(ta)
        tr.append(cell)
      })
    })
    wrap.append(table)

    const focusCell = (r: number, c: number) =>
      wrap.querySelector<HTMLTextAreaElement>(`textarea[data-r="${r}"][data-c="${c}"]`)?.focus()

    const blankRow = (m: TableModel) => m.align.map(() => '')
    const insertRow = (i: number, c = 0) => { const m = read(); m.rows.splice(i, 0, blankRow(m)); commit(view, wrap, m, { r: i, c }) }
    const insertCol = (i: number, r = 0) => { const m = read(); m.align.splice(i, 0, ''); m.rows.forEach((row) => row.splice(i, 0, '')); commit(view, wrap, m, { r, c: i }) }

    // ── 셀 범위 선택 (엑셀처럼 드래그·Shift+클릭) ──
    type Rect = { r1: number; c1: number; r2: number; c2: number }
    let range: Rect | null = null
    const bounds = (g: Rect) => ({
      top: Math.min(g.r1, g.r2), bottom: Math.max(g.r1, g.r2), left: Math.min(g.c1, g.c2), right: Math.max(g.c1, g.c2),
    })
    const setRange = (g: Rect | null) => {
      // 한 칸짜리는 범위 아님 → 평소 텍스트 편집
      range = g && (g.r1 !== g.r2 || g.c1 !== g.c2) ? g : null
      const b = range && bounds(range)
      wrap.classList.toggle('has-range', !!range)
      table.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((ta) => {
        const r = Number(ta.dataset.r), c = Number(ta.dataset.c)
        ta.parentElement!.classList.toggle('sel', !!b && r >= b.top && r <= b.bottom && c >= b.left && c <= b.right)
      })
    }
    const cellsIn = (g: Rect) => {
      const b = bounds(g)
      return [...table.querySelectorAll<HTMLTextAreaElement>('textarea')].filter((ta) => {
        const r = Number(ta.dataset.r), c = Number(ta.dataset.c)
        return r >= b.top && r <= b.bottom && c >= b.left && c <= b.right
      })
    }
    const toTsv = (g: Rect) => {
      const b = bounds(g), { rows } = read()
      return rows.slice(b.top, b.bottom + 1).map((row) => row.slice(b.left, b.right + 1).join('\t')).join('\n')
    }
    const clearRange = (g: Rect) => { cellsIn(g).forEach((ta) => { ta.value = '' }); commit(view, wrap, read()) }
    const cellAt = (x: number, y: number) =>
      (document.elementFromPoint(x, y)?.closest('td, th')?.querySelector('textarea') as HTMLTextAreaElement | null) ?? null

    wrap.addEventListener('mousedown', (e) => {
      const ta = e.target as HTMLTextAreaElement
      if (e.button !== 0 || !ta.dataset?.r) return
      const r = Number(ta.dataset.r), c = Number(ta.dataset.c)
      if (e.shiftKey) {
        // Shift+클릭: 포커스된 셀부터 범위
        e.preventDefault()
        const from = current()
        setRange({ r1: from.r, c1: from.c, r2: r, c2: c })
        return
      }
      setRange(null)
      const onMove = (ev: MouseEvent) => {
        const over = cellAt(ev.clientX, ev.clientY)
        if (!over || !wrap.contains(over)) return
        const r2 = Number(over.dataset.r), c2 = Number(over.dataset.c)
        if (!range && r2 === r && c2 === c) return // 아직 같은 셀: 텍스트 드래그 선택
        setRange({ r1: r, c1: c, r2, c2 })
        // 셀 범위 모드에선 글자 선택 하이라이트 제거
        ta.setSelectionRange(ta.selectionStart, ta.selectionStart)
        window.getSelection()?.removeAllRanges()
      }
      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
      }
      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    })
    wrap.addEventListener('focusout', (e) => { if (!wrap.contains(e.relatedTarget as Node)) setRange(null) })

    wrap.addEventListener('copy', (e) => {
      if (!range) return
      e.preventDefault()
      e.clipboardData?.setData('text/plain', toTsv(range))
    })
    wrap.addEventListener('cut', (e) => {
      if (!range) return
      e.preventDefault()
      e.clipboardData?.setData('text/plain', toTsv(range))
      clearRange(range)
    })
    // 엑셀·구글시트에서 복사한 표(탭·줄바꿈 구분) → 선택 범위 왼쪽 위부터 채움, 모자라면 행·열 추가
    wrap.addEventListener('paste', (e) => {
      const text = (e.clipboardData?.getData('text/plain') ?? '').replace(/\r/g, '').replace(/\n$/, '')
      if (!range && !/[\t\n]/.test(text)) return // 한 칸 텍스트는 기본 붙여넣기
      e.preventDefault()
      const grid = text.split('\n').map((line) => line.split('\t').map((v) => v.trim()))
      const start = range ? (({ top, left }) => ({ r: top, c: left }))(bounds(range)) : current()
      const m = read()
      while (m.rows.length < start.r + grid.length) m.rows.push(blankRow(m))
      const width = start.c + Math.max(...grid.map((line) => line.length))
      while (m.align.length < width) { m.align.push(''); m.rows.forEach((row) => row.push('')) }
      grid.forEach((line, i) => line.forEach((v, j) => { m.rows[start.r + i][start.c + j] = v }))
      setRange(null)
      commit(view, wrap, m, start)
    })

    // ── 경계 hover 시 동그라미 + 버튼 (엑셀·노션처럼 열/행 사이에 삽입) ──
    const addBtn = (kind: 'col' | 'row') => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = `cm-md-table-add ${kind}`
      // 글자 + 는 폰트 따라 흐릿하게 깨짐 → SVG 아이콘
      b.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>'
      b.setAttribute('aria-label', kind === 'col' ? '열 추가' : '행 추가')
      b.addEventListener('mousedown', (e) => e.preventDefault()) // 셀 포커스 유지
      b.addEventListener('click', () => {
        const i = Number(b.dataset.i), { r, c } = current()
        if (kind === 'col') insertCol(i, r)
        else insertRow(i, c)
      })
      wrap.append(b)
      return b
    }
    const colAdd = addBtn('col'), rowAdd = addBtn('row')
    const place = (b: HTMLButtonElement, i: number, x: number, y: number, len: number) => {
      if (i < 0) { delete b.dataset.show; return }
      b.dataset.show = ''
      b.dataset.i = String(i)
      b.style.left = `${x}px`
      b.style.top = `${y}px`
      b.style.setProperty('--len', `${len - 10}px`) // 안내선은 동그라미 가장자리(반지름 10px)부터
    }
    const HIT = 10 // 경계선에서 이 거리(px) 안이면 버튼 표시
    wrap.addEventListener('mousemove', (e) => {
      if ((e.target as HTMLElement).classList.contains('cm-md-table-add')) return // 버튼 위에선 위치 고정
      if (e.buttons) { place(colAdd, -1, 0, 0, 0); place(rowAdd, -1, 0, 0, 0); return } // 셀 드래그 중엔 숨김
      const w = wrap.getBoundingClientRect(), t = table.getBoundingClientRect()
      const head = [...table.rows[0].cells].map((cell) => cell.getBoundingClientRect())
      const rowRects = [...table.rows].map((tr) => tr.getBoundingClientRect())

      // 열 경계: 표 윗변 ~ 헤더 행 높이 안에서, 세로 경계선 근처
      let col = -1, colX = 0
      if (e.clientY >= w.top && e.clientY <= head[0].bottom) {
        const edges = [head[0].left, ...head.map((h) => h.right)]
        col = edges.findIndex((x) => Math.abs(x - e.clientX) <= HIT)
        colX = edges[col] ?? 0
      }
      place(colAdd, col, colX - w.left, t.top - w.top, t.height)

      // 행 경계: 왼쪽 여백 ~ 첫 열 안에서, 가로 경계선 근처 (헤더 위로는 삽입 불가)
      let row = -1, rowY = 0
      if (col < 0 && e.clientX >= w.left && e.clientX <= head[0].right) {
        const i = rowRects.findIndex((rr) => Math.abs(rr.bottom - e.clientY) <= HIT)
        if (i >= 0) { row = i + 1; rowY = rowRects[i].bottom }
      }
      place(rowAdd, row, t.left - w.left, rowY - w.top, t.width)
    })
    wrap.addEventListener('mouseleave', () => { place(colAdd, -1, 0, 0, 0); place(rowAdd, -1, 0, 0, 0) })

    // ── 우클릭 메뉴: 삽입·삭제 (엑셀처럼) ──
    const menu = document.createElement('div')
    menu.className = 'cm-md-table-menu'
    menu.setAttribute('role', 'menu')
    menu.hidden = true
    wrap.append(menu)
    const closeMenu = () => {
      menu.hidden = true
      document.removeEventListener('mousedown', onOutside, true)
      document.removeEventListener('keydown', onEsc, true)
    }
    const onOutside = (e: MouseEvent) => { if (!menu.contains(e.target as Node)) closeMenu() }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu() }

    wrap.addEventListener('contextmenu', (e) => {
      const target = e.target as HTMLTextAreaElement
      if (!target.dataset.r) return
      e.preventDefault()
      target.focus()
      const r = Number(target.dataset.r), c = Number(target.dataset.c)
      const { rows } = read()
      menu.replaceChildren()
      const item = (label: string, enabled: boolean, run: () => void, danger = false) => {
        const b = document.createElement('button')
        b.type = 'button'
        b.setAttribute('role', 'menuitem')
        b.textContent = label
        b.disabled = !enabled
        if (danger) b.className = 'danger'
        b.addEventListener('mousedown', (ev) => ev.preventDefault())
        b.addEventListener('click', () => { closeMenu(); run() })
        menu.append(b)
      }
      const sep = () => menu.append(document.createElement('hr'))
      item('위에 행 삽입', r > 0, () => insertRow(r, c))
      item('아래에 행 삽입', true, () => insertRow(r + 1, c))
      item('왼쪽에 열 삽입', true, () => insertCol(c, r))
      item('오른쪽에 열 삽입', true, () => insertCol(c + 1, r))
      sep()
      // 헤더와 마지막 본문 행, 마지막 열은 유지 (마크다운 표 최소 구조)
      item('행 삭제', r > 0 && rows.length > 2, () => {
        const m = read(); m.rows.splice(r, 1); commit(view, wrap, m, { r: Math.min(r, m.rows.length - 1), c })
      })
      item('열 삭제', rows[0].length > 1, () => {
        const m = read(); m.align.splice(c, 1); m.rows.forEach((row) => row.splice(c, 1)); commit(view, wrap, m, { r, c: Math.min(c, m.align.length - 1) })
      })
      sep()
      item('표 삭제', true, () => {
        const range = rangeOf(view, wrap)
        if (range) view.dispatch({ changes: { from: range.from, to: Math.min(range.to + 1, view.state.doc.length) } })
      }, true)
      menu.style.left = `${Math.min(e.clientX, window.innerWidth - 180)}px`
      menu.style.top = `${Math.min(e.clientY, window.innerHeight - 260)}px`
      menu.hidden = false
      document.addEventListener('mousedown', onOutside, true)
      document.addEventListener('keydown', onEsc, true)
    })

    wrap.addEventListener('input', () => commit(view, wrap, read()))
    wrap.addEventListener('keydown', (e) => {
      if (range) {
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); clearRange(range); return }
        if (e.key === 'Escape') { setRange(null); return }
        // 복사·붙여넣기 단축키와 보조키만 범위 유지, 나머지 입력은 범위 해제
        if (!e.metaKey && !e.ctrlKey && !['Shift', 'Alt', 'Meta', 'Control'].includes(e.key)) setRange(null)
      }
      const { rows: cells } = read()
      const rows = cells.length, cols = cells[0].length
      const { r, c } = current()
      if (e.key === 'Tab') {
        e.preventDefault()
        const i = r * cols + c + (e.shiftKey ? -1 : 1)
        if (i < 0) return
        if (i >= rows * cols) {
          // 마지막 셀에서 Tab → 새 행
          const m = read(); m.rows.push(m.align.map(() => '')); commit(view, wrap, m, { r: rows, c: 0 })
          return
        }
        focusCell(Math.floor(i / cols), i % cols)
      } else if (e.key === 'Enter' && !e.isComposing) {
        // 셀 안 줄바꿈은 마크다운 표에서 불가 → 아래 셀로 이동, 마지막 행이면 새 행
        e.preventDefault()
        if (r + 1 < rows) return focusCell(r + 1, c)
        const m = read(); m.rows.push(m.align.map(() => '')); commit(view, wrap, m, { r: rows, c })
      }
    })

    if (pendingFocus) {
      const { r, c } = pendingFocus
      pendingFocus = null
      // dispatch 안에서 DOM 반영이 끝난 직후 실행
      queueMicrotask(() => focusCell(r, c))
    }
    return wrap
  }
}

// ── 문서 → 표 위젯 데코레이션 ────────────────────────────────
function buildDecorations(state: EditorState): DecorationSet {
  const decos: Range<Decoration>[] = []
  // 편집 직후 트리가 덜 파싱되면 표 노드가 잠깐 사라져 위젯이 새로 그려짐(포커스 손실) → 끝까지 파싱
  // ponytail: 200ms 상한. 아주 긴 글에서 넘기면 부분 트리로 대체
  ;(ensureSyntaxTree(state, state.doc.length, 200) ?? syntaxTree(state)).iterate({
    enter: (node) => {
      if (node.name !== 'Table') return
      const from = state.doc.lineAt(node.from).from
      const to = state.doc.lineAt(node.to).to
      decos.push(Decoration.replace({ widget: new TableWidget(parseTable(state.sliceDoc(from, to))), block: true }).range(from, to))
      return false
    },
  })
  return Decoration.set(decos)
}

const tableField = StateField.define<DecorationSet>({
  create: buildDecorations,
  // 문서 변경 또는 파서가 뒤늦게 트리를 완성했을 때 다시 계산
  update: (decos, tr) =>
    tr.docChanged || syntaxTree(tr.startState) !== syntaxTree(tr.state) ? buildDecorations(tr.state) : decos,
  provide: (f) => EditorView.decorations.from(f),
})

const tableTheme = EditorView.baseTheme({
  // 왼쪽·위 여백: 경계 + 버튼이 표 밖으로 반쯤 나와도 hover 영역 안에 있게
  '.cm-md-table': { position: 'relative', margin: '8px 40px 16px 26px', padding: '14px 0 0 14px', fontFamily: 'var(--font-sans)' },
  '.cm-md-table table': { width: '100%', borderCollapse: 'collapse' },
  '.cm-md-table th, .cm-md-table td': { border: '1px solid var(--border)', padding: '0', verticalAlign: 'top' },
  '.cm-md-table th': { background: 'var(--table-header)' },
  '.cm-md-table textarea': {
    display: 'block', width: '100%', minWidth: '6ch', resize: 'none', border: '0', outline: '0',
    background: 'transparent', color: 'inherit', font: 'inherit', fontSize: '14px', lineHeight: '1.5',
    padding: '8px 12px', fieldSizing: 'content',
  },
  '.cm-md-table th textarea': { fontWeight: '600' },
  '.cm-md-table textarea:focus': { boxShadow: 'inset 0 0 0 2px var(--primary)' },
  // 범위 선택: 셀 배경에 primary 반투명 덮기, 선택 중엔 커서 숨김
  '.cm-md-table .sel': { boxShadow: 'inset 0 0 0 9999px color-mix(in srgb, var(--primary) 16%, transparent)' },
  '.cm-md-table.has-range textarea': { caretColor: 'transparent' },
  '.cm-md-table.has-range textarea:focus': { boxShadow: 'none' },

  // 경계 삽입 버튼 + 안내선
  '.cm-md-table-add': {
    position: 'absolute', zIndex: '2', display: 'none', alignItems: 'center', justifyContent: 'center',
    width: '20px', height: '20px', margin: '-10px 0 0 -10px', padding: '0', border: '2px solid var(--card)', borderRadius: '50%',
    background: 'var(--primary)', color: 'var(--primary-foreground)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.25)', cursor: 'pointer',
  },
  '.cm-md-table-add[data-show]': { display: 'flex' },
  '.cm-md-table-add::after': { content: '""', position: 'absolute', background: 'var(--primary)', pointerEvents: 'none' },
  '.cm-md-table-add.col::after': { top: '18px', left: '7px', width: '2px', height: 'var(--len)' },
  '.cm-md-table-add.row::after': { left: '18px', top: '7px', height: '2px', width: 'var(--len)' },

  // 우클릭 메뉴
  '.cm-md-table-menu': {
    position: 'fixed', zIndex: '50', minWidth: '160px', padding: '4px', border: '1px solid var(--border)', borderRadius: '10px',
    background: 'var(--popover)', color: 'var(--popover-foreground)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: '13px',
  },
  '.cm-md-table-menu button': {
    display: 'block', width: '100%', padding: '6px 10px', border: '0', borderRadius: '6px',
    background: 'transparent', color: 'inherit', font: 'inherit', textAlign: 'left', cursor: 'pointer',
  },
  '.cm-md-table-menu button:hover:not(:disabled)': { background: 'color-mix(in srgb, var(--foreground) 8%, transparent)' },
  '.cm-md-table-menu button:disabled': { opacity: '0.4', cursor: 'default' },
  '.cm-md-table-menu button.danger': { color: 'var(--destructive)' },
  '.cm-md-table-menu hr': { margin: '4px 0', border: '0', borderTop: '1px solid var(--border)' },
})

export const tableEditor = [tableField, tableTheme]

/** 툴바: 커서 줄 아래에 2열 표 삽입 후 첫 헤더 셀 포커스 */
export function insertTable(view: EditorView) {
  const line = view.state.doc.lineAt(view.state.selection.main.from)
  pendingFocus = { r: 0, c: 0 }
  view.dispatch({ changes: { from: line.to, insert: `\n\n| | |\n| --- | --- |\n| | |\n` } })
}
