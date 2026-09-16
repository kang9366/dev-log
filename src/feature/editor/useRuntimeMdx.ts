'use client'
/**
 * 에디터 미리보기: MDX 문자열을 브라우저에서 실시간 컴파일 → React 컴포넌트로 변환
 * - 글 페이지와 같은 compileMdx(JS 제거 포함) 사용 → 미리보기와 실제 글 결과가 같음
 * - 이전 Component 유지: 컴파일 중에도 이전 결과를 계속 표시 (깜빡임 없음)
 * - stale 취소: runId 로 오래된 비동기 결과 무시
 */
import { useState, useEffect, useRef, type ComponentType } from 'react'
import { compileMdx } from '@lib/mdx'
import { runMdx } from '@feature/post/MdxContent'

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

    timer.current = setTimeout(async () => {
      const id = ++runId.current
      setCompiling(true)

      try {
        const Content = runMdx(await compileMdx(source))
        if (id !== runId.current) return
        setComponent(() => Content)
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
