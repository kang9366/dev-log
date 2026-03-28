/**
 * 브라우저에서 MDX 문자열을 실시간으로 컴파일 → React 컴포넌트로 변환
 * - debounce 150ms (이전 450ms 대비 3배 빠른 반응)
 * - 이전 Component 유지: 컴파일 중에도 이전 결과를 계속 표시 (깜빡임 없음)
 * - stale 취소: runId 로 오래된 비동기 결과 무시
 */
import { useState, useEffect, useRef, type ComponentType } from 'react'
import { compile, run } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import { useMDXComponents } from '@mdx-js/react'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

function stripExports(source: string): string {
  const lines = source.split('\n')
  const out: string[] = []
  let inExport = false
  let depth = 0
  for (const line of lines) {
    if (!inExport && /^export\s+(const|let|var|function|default)/.test(line.trim())) {
      inExport = true
      depth = [...line].reduce((n, c) => n + (c === '{' ? 1 : c === '}' ? -1 : 0), 0)
      if (depth <= 0) inExport = false
      continue
    }
    if (inExport) {
      depth += [...line].reduce((n, c) => n + (c === '{' ? 1 : c === '}' ? -1 : 0), 0)
      if (depth <= 0) inExport = false
      continue
    }
    out.push(line)
  }
  return out.join('\n').trimStart()
}

export interface RuntimeMdxResult {
  Component: ComponentType | null
  error: string | null
  compiling: boolean
}

export function useRuntimeMdx(source: string, debounceMs = 0): RuntimeMdxResult {
  const [Component, setComponent] = useState<ComponentType | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [compiling, setCompiling] = useState(false)

  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const runId = useRef(0)

  useEffect(() => {
    clearTimeout(timer.current)
    // ✅ setCompiling(true)를 타이머 안으로 이동:
    //    매 키입력마다 compiling=true 가 되어 발생하는 시각적 깜빡임 방지

    timer.current = setTimeout(async () => {
      const id = ++runId.current
      setCompiling(true)

      try {
        const cleaned = stripExports(source)

        const compiled = await compile(cleaned, {
          outputFormat:         'function-body',
          remarkPlugins:        [remarkGfm],
          rehypePlugins:        [rehypeHighlight],
          providerImportSource: '@mdx-js/react',
          development:          false,
        })

        if (id !== runId.current) return

        const { default: Content } = await run(String(compiled), {
          ...runtime,
          useMDXComponents,
          baseUrl: import.meta.url,
        })

        if (id !== runId.current) return

        setComponent(() => Content as ComponentType)
        setError(null)
      } catch (e) {
        if (id !== runId.current) return
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (id === runId.current) setCompiling(false)
      }
    }, debounceMs)

    return () => clearTimeout(timer.current)
  }, [source, debounceMs])

  return { Component, error, compiling }
}
