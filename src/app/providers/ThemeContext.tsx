/**
 * AppThemeProvider + useThemeMode
 *
 * - 라이트/다크 모드를 전역으로 관리
 * - localStorage('devlog-theme')에 사용자 설정 저장
 * - 저장값 없으면 OS 시스템 설정 자동 감지
 * - MUI ThemeProvider + CssBaseline 내장
 */
import { createContext, useContext, useState, useMemo } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createAppTheme } from '@ds/theme'
import type { PropsWithChildren } from 'react'

type Mode = 'light' | 'dark'

interface ThemeModeContextValue {
  mode: Mode
  toggleMode: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'light',
  toggleMode: () => {},
})

function getInitialMode(): Mode {
  const saved = localStorage.getItem('devlog-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<Mode>(getInitialMode)

  const toggleMode = () => {
    setMode((prev) => {
      const next: Mode = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('devlog-theme', next)
      return next
    })
  }

  const muiTheme = useMemo(() => createAppTheme(mode), [mode])

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

/** 다크모드 상태 및 토글 함수 */
// eslint-disable-next-line react-refresh/only-export-components
export const useThemeMode = () => useContext(ThemeModeContext)


