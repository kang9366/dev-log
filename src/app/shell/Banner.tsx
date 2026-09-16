import { Box, Chip, Container, Stack, InputBase, IconButton } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import EditIcon from '@mui/icons-material/Edit'
import LogoutIcon from '@mui/icons-material/Logout'
import { useNavigate } from 'react-router-dom'
import { useThemeMode } from '@app/providers/ThemeContext'
import { supabase } from '../../lib/supabase'
import { useSession } from '../../lib/useSession'
import { AdminLoginButton } from '@feature/auth/AdminLoginButton'

export const Banner = () => {
  const { mode, toggleMode } = useThemeMode()
  const isDark = mode === 'dark'
  const navigate = useNavigate()
  const { session, isAdmin, ready } = useSession()

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        bgcolor: isDark ? 'rgba(23, 23, 23, 0.85)' : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        width: '100%',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: 'background-color 0.2s ease',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack direction="row" alignItems="center" justifyContent="flex-end">
          {/* 우측: 검색창 + 다크모드 토글 */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: isDark ? 'grey.800' : 'grey.200',
                borderRadius: '20px',
                px: 2,
                py: 0.5,
                width: { xs: '130px', sm: '180px', md: '240px' },
                transition: 'background-color 0.2s ease, width 0.2s ease',
              }}
            >
              <InputBase
                placeholder="검색어를 입력해주세요"
                sx={{ flex: 1, fontSize: '14px', minWidth: 0 }}
              />
              <SearchIcon sx={{ color: 'text.secondary', fontSize: 20, flexShrink: 0 }} />
            </Box>

            {isAdmin && (
              <>
                <Chip label="관리자 모드" size="small" color="primary" variant="outlined" sx={{ display: { xs: 'none', sm: 'flex' } }} />
                <IconButton onClick={() => navigate('/editor')} aria-label="새 글 쓰기" title="새 글 쓰기">
                  <EditIcon fontSize="small" />
                </IconButton>
              </>
            )}
            {session && (
              <IconButton onClick={() => supabase.auth.signOut()} aria-label="로그아웃" title="로그아웃">
                <LogoutIcon fontSize="small" />
              </IconButton>
            )}
            {ready && !session && <AdminLoginButton />}

            <IconButton
              onClick={toggleMode}
              aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
              sx={{
                bgcolor: isDark ? 'grey.100' : 'grey.900',
                color: isDark ? 'grey.900' : 'grey.100',
                width: 36,
                height: 36,
                flexShrink: 0,
                transition: 'background-color 0.2s ease, color 0.2s ease',
                '&:hover': {
                  bgcolor: isDark ? 'grey.300' : 'grey.700',
                },
              }}
            >
              {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
