'use client'
import { ShieldUser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LoginForm } from './Login'

/** 상단 바 관리자 로그인 버튼 + 로그인 다이얼로그 */
export function AdminLoginButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-md" aria-label="관리자 로그인" title="관리자 로그인">
          <ShieldUser />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>관리자 로그인</DialogTitle>
        </DialogHeader>
        <LoginForm />
      </DialogContent>
    </Dialog>
  )
}
