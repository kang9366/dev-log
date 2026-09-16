/**
 * 로컬 개발 전용: 인증번호 없이 관리자 세션 발급.
 * - `next dev` 에서만 동작. 빌드/배포 환경(NODE_ENV=production)에서는 404
 * - localhost 요청만 허용 (같은 네트워크 기기, DNS rebinding 차단)
 * - 발급되는 토큰은 실제 관리자 토큰 → 운영 DB에 그대로 쓰기 가능
 */
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/

function isLocalRequest(req: NextRequest) {
  if (!LOCAL_HOST.test(req.headers.get('host') ?? '')) return false
  const origin = req.headers.get('origin')
  if (!origin) return true
  try {
    return LOCAL_HOST.test(new URL(origin).host)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  if (!isLocalRequest(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'missing_secret_key' }, { status: 500 })
  }
  const noSession = { auth: { persistSession: false, autoRefreshToken: false } }

  const admin = createClient(url, secretKey, noSession)
  const { data: row, error: dbError } = await admin
    .from('admins')
    .select('email')
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (dbError || !row) {
    console.error('[dev-login] admin lookup failed', dbError)
    return NextResponse.json({ error: 'not_configured' }, { status: 500 })
  }

  // 메일 발송 없이 로그인 토큰 생성 → 바로 검증해서 세션 획득
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email: row.email })
  if (linkError) {
    console.error('[dev-login] generateLink failed', linkError.message)
    return NextResponse.json({ error: 'link_failed' }, { status: 500 })
  }

  const auth = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, noSession).auth
  const { data, error } = await auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'email' })
  if (error || !data.session) {
    console.error('[dev-login] verify failed', error?.message)
    return NextResponse.json({ error: 'verify_failed' }, { status: 500 })
  }

  return NextResponse.json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
}
