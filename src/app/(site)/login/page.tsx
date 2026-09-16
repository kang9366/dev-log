import { Suspense } from 'react'
import type { Metadata } from 'next'
import Login from '@feature/auth/Login'

export const metadata: Metadata = { title: '관리자 로그인', robots: { index: false } }

export default function LoginPage() {
  // useSearchParams 사용 → Suspense 필요
  return (
    <Suspense>
      <Login />
    </Suspense>
  )
}
