'use client'
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface SessionState {
  session: Session | null
  /** 서버(admins 테이블) 기준 관리자 여부 */
  isAdmin: boolean
  /** false 면 아직 세션/관리자 여부를 모름 */
  ready: boolean
}

/** 현재 로그인 세션 + 관리자 모드 여부 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ session: null, isAdmin: false, ready: false })

  useEffect(() => {
    let cancelled = false

    const apply = async (session: Session | null) => {
      const isAdmin = session ? (await supabase.rpc('is_admin')).data === true : false
      if (!cancelled) setState({ session, isAdmin, ready: true })
    }

    // INITIAL_SESSION 포함 모든 변경을 받음.
    // 콜백 안에서 바로 supabase 호출하면 교착될 수 있어 setTimeout 으로 미룸
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => apply(session), 0)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return state
}
