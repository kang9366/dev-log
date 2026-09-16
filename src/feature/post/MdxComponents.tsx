/**
 * MDX 렌더링 시 HTML 요소를 MUI 기반 스타일 컴포넌트로 교체.
 * MDXProvider의 components prop에 전달합니다.
 */
import {
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import React, { useState, type ComponentPropsWithoutRef } from 'react'
import { fontFamily } from '@ds/tokens/typography'

// ── 헤딩 텍스트 → slug id 변환 ───────────────
function toHeadingId(children: React.ReactNode): string {
  const text = React.Children.toArray(children)
    .map((c) => (typeof c === 'string' ? c : ''))
    .join('')
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w가-힣ㄱ-ㅎㅏ-ㅣ-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

// ── 공통 sx ──────────────────────────────────
const proseText: SxProps<Theme> = {
  fontFamily: fontFamily.sans,
  color: 'text.primary',   // ← theme-aware
  lineHeight: 1.75,
}

// ── 헤딩 ─────────────────────────────────────
function H2({ children }: ComponentPropsWithoutRef<'h2'>) {
  const id = toHeadingId(children)
  return (
    <Typography
      id={id}
      variant="h2"
      component="h2"
      sx={{
        ...proseText,
        fontSize: { xs: '1.5rem', md: '1.875rem' },
        fontWeight: 700,
        mt: 5, mb: 2, pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',          // ← theme-aware
        letterSpacing: '-0.02em',
        scrollMarginTop: '74px',
      }}
    >
      {children}
    </Typography>
  )
}

function H3({ children }: ComponentPropsWithoutRef<'h3'>) {
  const id = toHeadingId(children)
  return (
    <Typography
      id={id}
      variant="h3"
      component="h3"
      sx={{
        ...proseText,
        fontSize: { xs: '1.25rem', md: '1.5rem' },
        fontWeight: 600,
        mt: 4,
        mb: 1.5,
        letterSpacing: '-0.01em',
        scrollMarginTop: '74px',
      }}
    >
      {children}
    </Typography>
  )
}

function H4({ children }: ComponentPropsWithoutRef<'h4'>) {
  return (
    <Typography
      variant="h4"
      component="h4"
      sx={{ ...proseText, fontSize: '1.125rem', fontWeight: 600, mt: 3, mb: 1 }}
    >
      {children}
    </Typography>
  )
}

// ── 본문 ─────────────────────────────────────
function P({ children }: ComponentPropsWithoutRef<'p'>) {
  return (
    <Typography
      component="p"
      sx={{ ...proseText, fontSize: '1rem', mb: 2.5 }}
    >
      {children}
    </Typography>
  )
}

// ── 인용구 ───────────────────────────────────
function Blockquote({ children }: ComponentPropsWithoutRef<'blockquote'>) {
  return (
    <Box
      component="blockquote"
      sx={{
        my: 3, pl: 3, py: 0.5,
        borderLeft: '4px solid',
        borderColor: 'primary.main',     // ← theme-aware
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),  // ← theme-aware
        borderRadius: '0 8px 8px 0',
        '& p': { mb: 0, color: 'text.secondary', fontSize: '0.9375rem' },
      }}
    >
      {children}
    </Box>
  )
}

// ── 코드 블록 (맥 스타일) ────────────────────────────────────
function Pre({ children }: ComponentPropsWithoutRef<'pre'>) {
  const [copied, setCopied] = useState(false)

  // <code> 자식에서 언어 클래스 및 텍스트 추출
  let language = ''
  let rawText  = ''

  React.Children.forEach(children as React.ReactNode, (child) => {
    if (!React.isValidElement(child)) return
    const cls = (child.props as { className?: string }).className ?? ''
    const match = cls.match(/language-(\w+)/)
    if (match) language = match[1]
    rawText = String((child.props as { children?: unknown }).children ?? '').trimEnd()
  })

  const handleCopy = () => {
    navigator.clipboard.writeText(rawText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Box
      sx={{
        my: 3.5,
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #3a3a3c',
        bgcolor: '#1c1c1e',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
      }}
    >
      {/* ── 맥 스타일 타이틀 바 ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: '14px',
          height: 38,
          bgcolor: '#2c2c2e',
          borderBottom: '1px solid #3a3a3c',
          gap: '6px',
          userSelect: 'none',
        }}
      >
        {/* 트래픽 라이트 */}
        {[
          { color: '#ff5f57', shadow: '#c0302b' },
          { color: '#febc2e', shadow: '#c08d0a' },
          { color: '#28c840', shadow: '#0a9520' },
        ].map(({ color, shadow }) => (
          <Box
            key={color}
            sx={{
              width: 12, height: 12,
              borderRadius: '50%',
              bgcolor: color,
              boxShadow: `0 0 0 0.5px ${shadow}`,
              flexShrink: 0,
            }}
          />
        ))}

        {/* 언어 라벨 — 중앙 */}
        {language && (
          <Typography
            sx={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 11,
              color: '#8e8e93',
              fontFamily: fontFamily.mono,
              letterSpacing: '0.06em',
              pointerEvents: 'none',
            }}
          >
            {language}
          </Typography>
        )}

        {/* 복사 버튼 — 우측 */}
        <Tooltip title={copied ? '복사됨!' : '복사'} placement="top">
          <Box
            component="button"
            onClick={handleCopy}
            sx={{
              ml: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              px: 1,
              py: 0.25,
              bgcolor: 'transparent',
              border: '1px solid transparent',
              borderRadius: '5px',
              cursor: 'pointer',
              color: copied ? '#28c840' : '#8e8e93',
              fontSize: 11,
              fontFamily: fontFamily.mono,
              transition: 'all 0.15s',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.08)',
                borderColor: '#3a3a3c',
                color: '#e5e5e7',
              },
            }}
          >
            {copied ? (
              // 체크 아이콘
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              // 복사 아이콘
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
            {copied ? 'Copied!' : 'Copy'}
          </Box>
        </Tooltip>
      </Box>

      {/* ── 코드 영역 ── */}
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 0,
          bgcolor: '#1c1c1e',
          '& code': {
            display: 'block',
            p: '20px 24px',
            overflowX: 'auto',
            fontFamily: fontFamily.mono,
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: '#e5e5e7',
            bgcolor: 'transparent',
            border: 'none',
            borderRadius: 0,
          },
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

// ── 인라인 코드 ───────────────────────────────
function Code({ children }: ComponentPropsWithoutRef<'code'>) {
  return (
    <Box
      component="code"
      sx={(theme) => ({
        px: 0.75, py: 0.25,
        borderRadius: '5px',
        bgcolor: alpha(theme.palette.primary.main, 0.1),
        color: theme.palette.primary.dark,
        fontFamily: fontFamily.mono,
        fontSize: '0.85em',
        border: '1px solid',
        borderColor: alpha(theme.palette.primary.main, 0.25),
        ...theme.applyStyles('dark', { color: theme.palette.primary.light }),
      })}
    >
      {children}
    </Box>
  )
}

// ── 목록 ─────────────────────────────────────
function Ul({ children }: ComponentPropsWithoutRef<'ul'>) {
  return (
    <Box
      component="ul"
      sx={{ ...proseText, pl: 3, mb: 2.5, '& li': { mb: 0.75 } }}
    >
      {children}
    </Box>
  )
}

function Ol({ children }: ComponentPropsWithoutRef<'ol'>) {
  return (
    <Box
      component="ol"
      sx={{ ...proseText, pl: 3, mb: 2.5, '& li': { mb: 0.75 } }}
    >
      {children}
    </Box>
  )
}

function Li({ children }: ComponentPropsWithoutRef<'li'>) {
  return (
    <Box
      component="li"
      sx={{ ...proseText, fontSize: '1rem' }}
    >
      {children}
    </Box>
  )
}

// ── 테이블 ───────────────────────────────────
function TableWrapper({ children }: ComponentPropsWithoutRef<'table'>) {
  return (
    <TableContainer
      sx={{
        my: 3,
        border: '1px solid',
        borderColor: 'divider',          // ← theme-aware
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <Table size="small">{children}</Table>
    </TableContainer>
  )
}

function Thead({ children }: ComponentPropsWithoutRef<'thead'>) {
  return <TableHead sx={{ bgcolor: 'primary.main' }}>{children}</TableHead>
}

function Tbody({ children }: ComponentPropsWithoutRef<'tbody'>) {
  return <TableBody>{children}</TableBody>
}

function Tr({ children }: ComponentPropsWithoutRef<'tr'>) {
  return (
    <TableRow
      sx={{
        '&:last-child td': { border: 0 },
        '&:hover': { bgcolor: 'action.hover' },  // ← theme-aware
      }}
    >
      {children}
    </TableRow>
  )
}

function Th({ children }: ComponentPropsWithoutRef<'th'>) {
  return (
    <TableCell
      sx={{
        fontWeight: 600,
        fontSize: '0.8125rem',
        color: '#fff',
        borderBottom: '1px solid',
        borderColor: 'primary.dark',   // ← theme-aware
        py: 1.5,
        px: 2,
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}
    >
      {children}
    </TableCell>
  )
}

function Td({ children }: ComponentPropsWithoutRef<'td'>) {
  return (
    <TableCell
      sx={{
        fontSize: '0.875rem',
        color: 'text.primary',           // ← theme-aware
        py: 1.5, px: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',          // ← theme-aware
      }}
    >
      {children}
    </TableCell>
  )
}

// ── 구분선 ───────────────────────────────────
function Hr() {
  return <Divider sx={{ my: 4 }} />
}

// ── 강조 ─────────────────────────────────────
function Strong({ children }: ComponentPropsWithoutRef<'strong'>) {
  return (
    <Box component="strong" sx={{ fontWeight: 700, color: 'text.primary' }}>
      {children}
    </Box>
  )
}

function Em({ children }: ComponentPropsWithoutRef<'em'>) {
  return (
    <Box component="em" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
      {children}
    </Box>
  )
}

// ── 글자 색 (에디터 색상 피커: <span data-color="#hex">) ──
function Span({ children, 'data-color': color }: ComponentPropsWithoutRef<'span'> & { 'data-color'?: string }) {
  const safeColor = color && /^#[0-9a-f]{3,8}$/i.test(color) ? color : undefined
  return <span style={safeColor ? { color: safeColor } : undefined}>{children}</span>
}

// ── Public export ─────────────────────────────
export const mdxComponents = {
  span:       Span,
  h2:         H2,
  h3:         H3,
  h4:         H4,
  p:          P,
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
