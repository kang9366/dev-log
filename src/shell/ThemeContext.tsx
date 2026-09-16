'use client'
/**
 * AppThemeProvider + useThemeMode
 *
 * - MUI CSS 변수 테마(light/dark) 제공
 * - 사용자 선택은 localStorage('devlog-theme')에 저장, 없으면 OS 설정 따름
 * - 서버 렌더링 때 깜빡임 방지는 루트 레이아웃의 InitColorSchemeScript 가 담당
 */
import { ThemeProvider, CssBaseline, useColorScheme } from '@mui/material'
import type { PropsWithChildren } from 'react'
import { theme, THEME_STORAGE_KEY } from '@ds/theme'

export function AppThemeProvider({ children }: PropsWithChildren) {
  return (
    <ThemeProvider theme={theme} modeStorageKey={THEME_STORAGE_KEY} defaultMode="system">
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  )
}

/**
 * 현재 적용된 모드와 토글 함수.
 * mode 는 서버 렌더링과 첫 렌더에서 undefined (저장값을 아직 모름)
 */
export function useThemeMode() {
  const { mode, systemMode, setMode } = useColorScheme()
  const resolved = mode === 'system' ? systemMode : mode
  return {
    mode: resolved,
    toggleMode: () => setMode(resolved === 'dark' ? 'light' : 'dark'),
  }
}
