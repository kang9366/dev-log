'use client'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@lib/supabase'
import { useSession } from '@lib/useSession'
import { Typography } from '@/components/ui/typography'

/** 로컬 개발(next dev): 메일 없이 아무 번호나 입력하면 관리자 로그인 (/api/dev-login) */
const DEV_LOGIN = process.env.NODE_ENV === 'development'

/** Edge Function(admin-otp) 호출. 실패 시 서버 에러 코드 반환 */
async function callAdminOtp(body: { action: 'send' } | { action: 'verify'; code: string }) {
  if (DEV_LOGIN) {
    if (body.action === 'send') return { data: null, errorCode: null }
    const res = await fetch('/api/dev-login', { method: 'POST' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) console.error('[dev-login]', json)
    return res.ok ? { data: json, errorCode: null } : { data: null, errorCode: 'dev_login_failed' }
  }

  const { data, error } = await supabase.functions.invoke('admin-otp', { body })
  if (!error) return { data, errorCode: null }
  const errorCode = error instanceof FunctionsHttpError
    ? ((await error.context.json().catch(() => ({}))) as { error?: string }).error ?? 'unknown'
    : 'network'
  return { data: null, errorCode }
}

/**
 * 관리자 로그인 — 등록된 관리자 이메일로 인증번호 발송 후 입력.
 * 인증번호는 폰에서 메일 확인하고 PC 에 입력해도 됨. 로그인 페이지와 상단 바 다이얼로그에서 공용
 */
export function LoginForm() {
  const [sent, setSent] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const sendCode = async () => {
    setLoading(true)
    setError('')
    const { errorCode } = await callAdminOtp({ action: 'send' })
    setLoading(false)
    if (errorCode) {
      setError(errorCode === 'rate_limited'
        ? '요청이 너무 잦습니다. 1분 정도 후 다시 시도해주세요.'
        : '인증번호를 보낼 수 없습니다. 잠시 후 다시 시도해주세요.')
      return
    }
    setSent(true)
  }

  const verifyCode = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, errorCode } = await callAdminOtp({ action: 'verify', code: code.trim() })
    if (errorCode) {
      setLoading(false)
      setError(errorCode === 'rate_limited'
        ? '시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'
        : errorCode === 'dev_login_failed'
          ? '개발용 로그인 실패. .env.local 의 SUPABASE_SECRET_KEY 와 서버 로그를 확인하세요.'
          : '인증번호가 올바르지 않거나 만료되었습니다.')
      return
    }
    // 로그인되면 상단 바/페이지가 세션 변경을 받아 관리자 모드로 전환됨
    const { error } = await supabase.auth.setSession(data)
    setLoading(false)
    if (error) setError('로그인에 실패했습니다.')
  }

  if (!sent) {
    return (
      <div className="flex flex-col gap-4">
        <Typography variant="body2" color="muted">등록된 관리자 이메일로 인증번호를 보냅니다.</Typography>
        {error && <Typography variant="body2" color="destructive" role="alert">{error}</Typography>}
        <Button size="lg" onClick={sendCode} disabled={loading} className="w-full">
          {loading && <Loader2 className="animate-spin" />}
          인증번호 받기
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={verifyCode} className="flex flex-col gap-4">
      <Typography variant="body2" color="muted">
        {DEV_LOGIN
          ? '개발 모드: 메일을 보내지 않았습니다. 아무 번호나 입력하세요.'
          : '관리자 이메일로 보낸 인증번호를 입력하세요.'}
      </Typography>
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-otp-code">인증번호</Label>
        <Input
          id="admin-otp-code"
          required
          autoFocus
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={10}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          aria-invalid={!!error}
        />
      </div>
      {error && <Typography variant="body2" color="destructive" role="alert">{error}</Typography>}
      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading && <Loader2 className="animate-spin" />}
        확인
      </Button>
      <Button type="button" variant="ghost" size="lg" onClick={sendCode} disabled={loading} className="w-full">
        인증번호 다시 받기
      </Button>
    </form>
  )
}

export default function Login() {
  const router = useRouter()
  const params = useSearchParams()
  const { isAdmin } = useSession()

  // 내부 경로만 허용 (open redirect 방지)
  const next = params.get('next') ?? ''
  const target = next.startsWith('/') && !next.startsWith('//') ? next : '/'

  // 로그인되면 원래 가려던 곳으로
  useEffect(() => {
    if (isAdmin) router.replace(target)
  }, [isAdmin, router, target])

  return (
    <div className="mx-auto flex max-w-[360px] flex-col gap-4 py-20">
      <Typography variant="h3" as="h1">관리자 로그인</Typography>
      <LoginForm />
    </div>
  )
}
