'use client'
/**
 * MDX 렌더링 시 HTML 요소를 스타일 컴포넌트로 교체.
 * MDXProvider 의 components prop 에 전달합니다.
 */
import React, { useRef, useState, type ComponentPropsWithoutRef } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Typography } from '@/components/ui/typography'

// ── 헤딩 텍스트 → slug id 변환 ───────────────
function textOf(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (React.isValidElement(node)) return textOf((node.props as { children?: React.ReactNode }).children)
  return ''
}

function toHeadingId(children: React.ReactNode): string {
  return textOf(children)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

// ── 헤딩 ─────────────────────────────────────
function H1({ children }: ComponentPropsWithoutRef<'h1'>) {
  return (
    <Typography variant="h2" as="h1" className="mt-10 mb-4 md:text-h1">
      {children}
    </Typography>
  )
}

function H2({ children }: ComponentPropsWithoutRef<'h2'>) {
  return (
    <Typography
      variant="h3"
      as="h2"
      id={toHeadingId(children)}
      className="mt-10 mb-4 scroll-mt-[84px] border-b pb-2 md:text-h2"
    >
      {children}
    </Typography>
  )
}

function H3({ children }: ComponentPropsWithoutRef<'h3'>) {
  return (
    <Typography variant="h4" as="h3" id={toHeadingId(children)} className="mt-8 mb-3 scroll-mt-[84px] md:text-h3">
      {children}
    </Typography>
  )
}

function H4({ children }: ComponentPropsWithoutRef<'h4'>) {
  return <Typography variant="h5" as="h4" className="mt-6 mb-2">{children}</Typography>
}

// ── 본문 ─────────────────────────────────────
function P({ children }: ComponentPropsWithoutRef<'p'>) {
  return <Typography variant="prose" className="mb-5">{children}</Typography>
}

function A({ children, href }: ComponentPropsWithoutRef<'a'>) {
  return (
    <a href={href} className="text-primary underline underline-offset-4 hover:text-accent-foreground">
      {children}
    </a>
  )
}

// ── 인용구 ───────────────────────────────────
function Blockquote({ children }: ComponentPropsWithoutRef<'blockquote'>) {
  return (
    <blockquote className="my-6 rounded-r-lg border-l-4 border-primary bg-primary/[0.08] py-4 pr-6 pl-6 [&_p]:mb-0 [&_p]:text-body1 [&_p]:text-muted-foreground">
      {children}
    </blockquote>
  )
}

// ── 코드 블록 (맥 스타일) ────────────────────────────────────
function Pre({ children }: ComponentPropsWithoutRef<'pre'>) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  // <code className="language-xxx"> 에서 언어 추출
  let language = ''
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const cls = (child.props as { className?: string }).className ?? ''
    language = cls.match(/language-(\w+)/)?.[1] ?? language
  })

  const handleCopy = () => {
    // 구문 강조 span 이 섞여 있어서 렌더된 텍스트를 복사
    const text = preRef.current?.textContent?.trimEnd() ?? ''
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="my-7 overflow-hidden rounded-xl border border-[#3a3a3c] bg-[#1c1c1e] shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
      {/* ── 맥 스타일 타이틀 바 ── */}
      <div className="relative flex h-[38px] items-center gap-1.5 border-b border-[#3a3a3c] bg-[#2c2c2e] px-3.5 select-none">
        {[
          { color: '#ff5f57', shadow: '#c0302b' },
          { color: '#febc2e', shadow: '#c08d0a' },
          { color: '#28c840', shadow: '#0a9520' },
        ].map(({ color, shadow }) => (
          <span
            key={color}
            aria-hidden
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: color, boxShadow: `0 0 0 0.5px ${shadow}` }}
          />
        ))}

        {language && (
          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-mono text-caption text-[#8e8e93]">
            {language}
          </span>
        )}

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? '복사됨' : '코드 복사'}
          className={cn(
            'ml-auto flex cursor-pointer items-center gap-1 rounded-[5px] border border-transparent px-2 py-0.5 font-mono text-caption transition-all',
            'hover:border-[#3a3a3c] hover:bg-white/[0.08] hover:text-[#e5e5e7]',
            copied ? 'text-[#28c840]' : 'text-[#8e8e93]',
          )}
        >
          {copied ? <Check className="size-3" strokeWidth={2.5} /> : <Copy className="size-3" />}
          <span aria-live="polite">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      {/* ── 코드 영역 (인라인 Code 스타일을 부모 셀렉터로 덮어씀) ── */}
      <pre
        ref={preRef}
        className="m-0 bg-[#1c1c1e] p-0 [&_code]:block [&_code]:overflow-x-auto [&_code]:rounded-none [&_code]:border-0 [&_code]:bg-transparent [&_code]:px-6 [&_code]:py-5 [&_code]:font-mono [&_code]:text-code [&_code]:text-[#e5e5e7]"
      >
        {children}
      </pre>
    </div>
  )
}

// ── 인라인 코드 ───────────────────────────────
function Code({ children, className }: ComponentPropsWithoutRef<'code'>) {
  // 코드 블록(```)의 code 는 hljs 클래스만 유지, 스타일은 Pre 가 담당
  if (className?.includes('hljs')) return <code className={className}>{children}</code>

  return (
    <code className="rounded-[5px] border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-[0.85em] text-accent-foreground">
      {children}
    </code>
  )
}

// ── 목록 ─────────────────────────────────────
function Ul({ children }: ComponentPropsWithoutRef<'ul'>) {
  return <ul className="mb-5 list-disc pl-6 text-prose [&_li]:mb-1.5">{children}</ul>
}

function Ol({ children }: ComponentPropsWithoutRef<'ol'>) {
  return <ol className="mb-5 list-decimal pl-6 text-prose [&_li]:mb-1.5">{children}</ol>
}

function Li({ children }: ComponentPropsWithoutRef<'li'>) {
  return <li className="text-prose">{children}</li>
}

// ── 테이블 ───────────────────────────────────
function TableWrapper({ children }: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="my-6 overflow-x-auto rounded-[10px] border bg-card">
      <table className="w-full border-collapse text-body2">{children}</table>
    </div>
  )
}

function Thead({ children }: ComponentPropsWithoutRef<'thead'>) {
  return <thead className="bg-table-header">{children}</thead>
}

function Tbody({ children }: ComponentPropsWithoutRef<'tbody'>) {
  return <tbody>{children}</tbody>
}

function Tr({ children }: ComponentPropsWithoutRef<'tr'>) {
  return (
    <tr className="hover:bg-black/[0.04] dark:hover:bg-white/[0.08] [&:last-child>td]:border-0">
      {children}
    </tr>
  )
}

function Th({ children }: ComponentPropsWithoutRef<'th'>) {
  return (
    <th className="border-r border-b px-4 py-3 text-left text-subtitle2 font-semibold whitespace-nowrap text-foreground last:border-r-0">
      {children}
    </th>
  )
}

function Td({ children }: ComponentPropsWithoutRef<'td'>) {
  return <td className="border-r border-b px-4 py-3 text-body2 last:border-r-0">{children}</td>
}

// ── 구분선 ───────────────────────────────────
function Hr() {
  return <hr className="my-8 border-border" />
}

// ── 강조 ─────────────────────────────────────
function Strong({ children }: ComponentPropsWithoutRef<'strong'>) {
  return <strong className="font-bold text-foreground">{children}</strong>
}

function Em({ children }: ComponentPropsWithoutRef<'em'>) {
  return <em className="text-muted-foreground italic">{children}</em>
}

// ── 글자 색 (에디터 색상 피커: <span data-color="#hex">) ──
function Span({ children, className, 'data-color': color }: ComponentPropsWithoutRef<'span'> & { 'data-color'?: string }) {
  const safeColor = color && /^#[0-9a-f]{3,8}$/i.test(color) ? color : undefined
  // className 유지: 코드 블록 구문 강조 span(hljs-keyword 등)도 이 컴포넌트를 거침
  return <span className={className} style={safeColor ? { color: safeColor } : undefined}>{children}</span>
}

// ── Public export ─────────────────────────────
export const mdxComponents = {
  span:       Span,
  h1:         H1,
  h2:         H2,
  h3:         H3,
  h4:         H4,
  p:          P,
  a:          A,
  blockquote: Blockquote,
  pre:        Pre,
  code:       Code,
  ul:         Ul,
  ol:         Ol,
  li:         Li,
  table:      TableWrapper,
  thead:      Thead,
  tbody:      Tbody,
  tr:         Tr,
  th:         Th,
  td:         Td,
  hr:         Hr,
  strong:     Strong,
  em:         Em,
}
