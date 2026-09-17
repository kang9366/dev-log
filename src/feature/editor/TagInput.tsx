'use client'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Hash, Plus, X } from 'lucide-react'
import { supabase } from '@lib/supabase'
import { cn } from '@/lib/utils'

/** 태그 표기 통일: 소문자, 공백 → '-' */
const normalizeTag = (v: string) => v.trim().toLowerCase().replace(/\s+/g, '-')

/**
 * 글 태그 1개 선택. 기존 태그 자동완성(글 수 표시) + 새 태그 만들기.
 * 선택되면 칩으로 표시, × 로 해제.
 */
export function TagInput({ id, value, onChange }: { id?: string; value: string; onChange: (tag: string) => void }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [counts, setCounts] = useState<Record<string, number>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  // 기존 태그와 글 수 (관리자는 임시저장 글까지 조회 가능)
  useEffect(() => {
    supabase.from('posts').select('tag').then(({ data }) => {
      const c: Record<string, number> = {}
      for (const { tag } of data ?? []) if (tag) c[tag] = (c[tag] ?? 0) + 1
      setCounts(c)
    })
  }, [])

  const q = normalizeTag(query)
  const options = useMemo(() => {
    const matched = Object.entries(counts)
      .filter(([tag]) => tag.includes(q))
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count, isNew: false }))
    // 입력값이 기존 태그와 정확히 같지 않으면 마지막에 "새로 만들기"
    return q && !counts[q] ? [...matched, { tag: q, count: 0, isNew: true }] : matched
  }, [counts, q])

  const pick = (tag: string) => {
    onChange(tag)
    setQuery('')
    setOpen(false)
  }

  if (value) {
    return (
      <div className="flex h-9 flex-1 items-center">
        <span className="inline-flex h-8 items-center gap-1 rounded-full bg-accent pr-1 pl-3 text-body2 font-medium text-accent-foreground">
          <Hash className="size-3.5" aria-hidden />
          {value}
          <button
            type="button"
            onClick={() => { onChange(''); requestAnimationFrame(() => inputRef.current?.focus()) }}
            aria-label={`${value} 태그 삭제`}
            className="ml-0.5 flex size-6 items-center justify-center rounded-full transition-colors hover:bg-primary/15"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </span>
      </div>
    )
  }

  return (
    <div className="relative flex-1">
      <div className="flex h-9 items-center gap-1.5 text-muted-foreground">
        <Hash className="size-4 shrink-0" aria-hidden />
        <input
          ref={inputRef}
          id={id}
          value={query}
          role="combobox"
          aria-label={id ? undefined : '태그'}
          aria-expanded={open && options.length > 0}
          aria-controls={listId}
          aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
          aria-autocomplete="list"
          placeholder="태그 추가"
          onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true) }}
          onFocus={() => setOpen(true)}
          // 옵션 클릭(mousedown)이 먼저 처리되도록 닫기는 blur 에서
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return // 한글 조합 중 Enter 무시
            if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, options.length - 1)) }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
            else if (e.key === 'Enter') { e.preventDefault(); const o = options[active]; if (o) pick(o.tag) }
            else if (e.key === 'Escape') setOpen(false)
          }}
          className="min-w-0 flex-1 bg-transparent p-0 text-body1 text-foreground outline-none placeholder:text-neutral-400"
        />
      </div>

      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="태그 목록"
          className="absolute top-full left-0 z-20 mt-1 max-h-60 w-64 overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        >
          {options.map((o, i) => (
            <li
              key={`${o.isNew}-${o.tag}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(o.tag) }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                // 활성(키보드·hover) 항목: 글자색 8% 덮기 → 라이트·다크 모두 보임 (bg-muted 는 다크에서 팝오버와 같은 색)
                'flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-body2 transition-colors hover:bg-foreground/8',
                i === active && 'bg-foreground/8',
              )}
            >
              {o.isNew ? <Plus className="size-4 text-primary" aria-hidden /> : <Hash className="size-4 text-muted-foreground" aria-hidden />}
              <span className="min-w-0 flex-1 truncate">
                {o.isNew ? <>새 태그 <strong className="font-semibold">{o.tag}</strong></> : o.tag}
              </span>
              {!o.isNew && <span className="font-mono text-caption text-muted-foreground">{o.count}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
