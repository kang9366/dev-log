'use client'
/**
 * AppThemeProvider + useThemeMode
 *
 * - next-themes 로 <html class="light|dark"> 관리 (Tailwind/shadcn 의 dark: 변형과 연동)
 * - 사용자 선택은 localStorage('devlog-theme')에 저장, 없으면 OS 설정 따름
 * - 첫 페인트 전 스크립트로 적용해 새로고침 시 깜빡임 없음
 */
import { ThemeProvider, useTheme } from 'next-themes'
import type { PropsWithChildren } from 'react'

export function AppThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" storageKey="devlog-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}

/**
 * 현재 적용된 모드와 토글 함수.
 * mode 는 서버 렌더링과 첫 렌더에서 undefined (저장값을 아직 모름)
 */
export function useThemeMode() {
  const { resolvedTheme, setTheme } = useTheme()
  const mode = resolvedTheme as 'light' | 'dark' | undefined
  return {
    mode,
    toggleMode: () => setTheme(mode === 'dark' ? 'light' : 'dark'),
  }
}
