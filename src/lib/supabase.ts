import { createClient } from '@supabase/supabase-js'

/** 브라우저용 클라이언트 (로그인 세션 유지). 서버 컴포넌트에서는 @lib/posts 사용 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
)
