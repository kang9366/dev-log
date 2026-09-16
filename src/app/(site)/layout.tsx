import { RootLayout } from '@shell/RootLayout'

/** 상단 바 + 본문 여백. 에디터(풀스크린)는 이 레이아웃 밖 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <RootLayout>{children}</RootLayout>
}
