// 관리자 인증번호 로그인.
// 관리자 이메일은 admins 테이블에서 서버가 읽고, 브라우저에는 절대 내려주지 않음.
//   POST { action: 'send' }                → 관리자 이메일로 인증번호 발송
//   POST { action: 'verify', code: '...' } → 확인되면 세션 토큰 반환
// 메일에 인증번호가 들어가려면 Magic link 템플릿에 {{ .Token }} 필요 (커스텀 SMTP 설정 후 편집 가능)
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SECRET_KEY = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const PUBLISHABLE_KEY = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}').default ?? Deno.env.get('SUPABASE_ANON_KEY')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// admins 조회용 (RLS 우회, 서버 전용 키)
const db = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  let body: { action?: unknown; code?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_request' }, 400)
  }

  // ponytail: admins 첫 행 한 명만 지원. 관리자 여러 명이면 이메일 선택 방식 필요
  const { data: admin, error: dbError } = await db
    .from('admins')
    .select('email')
    .order('created_at')
    .limit(1)
    .maybeSingle()
  if (dbError || !admin) {
    console.error('admin lookup failed', dbError)
    return json({ error: 'not_configured' }, 500)
  }

  // 요청마다 새 클라이언트: 세션이 요청 간에 섞이지 않게
  const auth = createClient(SUPABASE_URL, PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }).auth

  // ponytail: Auth 의 IP당 rate limit 이 이 함수 서버 IP 기준으로 걸림(전체 공용).
  // 남이 시도를 몰아서 하면 잠깐 나도 막힐 수 있음. 문제되면 CAPTCHA 추가
  if (body.action === 'send') {
    // 계정은 이미 있음. 새 계정은 만들지 않음
    const { error } = await auth.signInWithOtp({ email: admin.email, options: { shouldCreateUser: false } })
    if (error) {
      console.error('send failed', error.status, error.message)
      return json({ error: error.status === 429 ? 'rate_limited' : 'send_failed' }, error.status === 429 ? 429 : 500)
    }
    return json({ ok: true })
  }

  if (body.action === 'verify') {
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    if (!/^\d{6,10}$/.test(code)) return json({ error: 'invalid_code' }, 400)

    const { data, error } = await auth.verifyOtp({ email: admin.email, token: code, type: 'email' })
    if (error || !data.session) {
      return json({ error: error?.status === 429 ? 'rate_limited' : 'invalid_code' }, error?.status === 429 ? 429 : 401)
    }
    return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token })
  }

  return json({ error: 'bad_request' }, 400)
})
