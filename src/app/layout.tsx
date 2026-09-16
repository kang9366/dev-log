import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter'
import { AppThemeProvider } from '@shell/ThemeContext'
import { THEME_STORAGE_KEY } from '@ds/theme'
import 'highlight.js/styles/github-dark.css' // 코드 블록 구문 강조

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'devlog', template: '%s | devlog' },
  description: '개발 블로그',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={inter.variable} suppressHydrationWarning>
      <body>
        {/* 저장된 라이트/다크 모드를 첫 페인트 전에 적용 (깜빡임 방지) */}
        <InitColorSchemeScript attribute="class" modeStorageKey={THEME_STORAGE_KEY} defaultMode="system" />
        <AppRouterCacheProvider>
          <AppThemeProvider>{children}</AppThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
