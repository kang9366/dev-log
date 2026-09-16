import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import { LoginForm } from './Login'

/** 상단 바 관리자 로그인 버튼 + 로그인 다이얼로그 */
export function AdminLoginButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <IconButton onClick={() => setOpen(true)} aria-label="관리자 로그인" title="관리자 로그인">
        <AdminPanelSettingsIcon fontSize="small" />
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>관리자 로그인</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <LoginForm />
        </DialogContent>
      </Dialog>
    </>
  )
}
