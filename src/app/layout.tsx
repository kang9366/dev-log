import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AppThemeProvider } from '@shell/ThemeContext'
import { cn } from '@/lib/utils'
import './globals.css'

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
    // next-themes 가 html class 를 바꾸므로 suppressHydrationWarning 필요
    <html lang="ko" className={cn('font-sans', inter.variable)} suppressHydrationWarning>
      <body>
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  )
}
