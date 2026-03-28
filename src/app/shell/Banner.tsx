import { Box, Container, Stack, Typography, InputBase, IconButton } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { useThemeMode } from '@app/providers/ThemeContext'

export const Banner = () => {
  const { mode, toggleMode } = useThemeMode()
  const isDark = mode === 'dark'

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
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          {/* 로고 + 메뉴 */}
          <Stack direction="row" spacing={{ xs: 2, md: 5 }} alignItems="center">
            <Typography variant="h5" sx={{ fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              MyLog
            </Typography>
            <Stack direction="row" spacing={3} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {['Development', 'Study', 'Publish', 'CS'].map((menu) => (
                <Typography
                  key={menu}
                  variant="body1"
                  sx={{ cursor: 'pointer', '&:hover': { color: 'text.secondary' } }}
                >
                  {menu}
                </Typography>
              ))}
            </Stack>
          </Stack>

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
