import type { Metadata } from 'next'
import { Archivo, IBM_Plex_Mono } from 'next/font/google'
import { AppThemeProvider } from '@shell/ThemeContext'
import { cn } from '@/lib/utils'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-plex-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'devlog', template: '%s | devlog' },
  description: '개발 블로그',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // next-themes 가 html class 를 바꾸므로 suppressHydrationWarning 필요
    <html lang="ko" className={cn('font-sans', archivo.variable, plexMono.variable)} suppressHydrationWarning>
      <body>
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  )
}
