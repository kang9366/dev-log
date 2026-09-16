'use client'
import { useRouter } from 'next/navigation'
import { LogOut, Moon, PenLine, Search, Sun } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useThemeMode } from '@shell/ThemeContext'
import { supabase } from '@lib/supabase'
import { useSession } from '@lib/useSession'
import { AdminLoginButton } from '@feature/auth/AdminLoginButton'

export const Banner = () => {
  const { toggleMode } = useThemeMode()
  const router = useRouter()
  const { session, isAdmin, ready } = useSession()

  return (
    <header className="sticky top-0 z-40 flex h-[50px] w-full items-center border-b bg-white/60 backdrop-blur-md transition-colors dark:bg-neutral-900/85">
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-end gap-3 px-4 sm:px-6">
        {/* 검색창 */}
        <label className="flex w-[130px] items-center rounded-full bg-neutral-200 px-4 py-1 transition-[width,background-color] sm:w-[180px] md:w-[240px] dark:bg-neutral-800">
          <input
            aria-label="검색"
            placeholder="검색어를 입력해주세요"
            className="min-w-0 flex-1 bg-transparent text-body2 outline-none placeholder:text-muted-foreground"
          />
          <Search className="size-5 shrink-0 text-muted-foreground" />
        </label>

        {isAdmin && (
          <>
            <Badge variant="outline" className="hidden border-primary text-primary sm:inline-flex">
              관리자 모드
            </Badge>
            <Button variant="ghost" size="icon-lg" onClick={() => router.push('/editor')} aria-label="새 글 쓰기" title="새 글 쓰기">
              <PenLine />
            </Button>
          </>
        )}
        {session && (
          <Button variant="ghost" size="icon-lg" onClick={() => supabase.auth.signOut()} aria-label="로그아웃" title="로그아웃">
            <LogOut />
          </Button>
        )}
        {ready && !session && <AdminLoginButton />}

        {/* 현재 모드는 서버가 모름 → 아이콘은 html.dark 클래스로 CSS 전환 (하이드레이션 불일치 방지) */}
        <Button
          size="icon-lg"
          onClick={toggleMode}
          aria-label="라이트/다크 모드 전환"
          title="라이트/다크 모드 전환"
          className="rounded-full bg-neutral-900 text-neutral-100 hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          <Moon className="dark:hidden" />
          <Sun className="hidden dark:block" />
        </Button>
      </div>
    </header>
  )
}
