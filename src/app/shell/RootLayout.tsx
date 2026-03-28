import { Box, GlobalStyles } from '@mui/material'
import type { PropsWithChildren } from 'react'
import { Banner } from './Banner'
import '../../index.css'

const globalStyles = (
  <GlobalStyles
    styles={{
      '*': { boxSizing: 'border-box' },
      // html 에는 overflow 절대 건드리지 않음
      // → html 에 overflow 설정 시 브라우저가 스크롤 컨테이너를 교체해
      //   마우스 휠 이벤트가 차단됨
      html: {
        scrollbarGutter: 'stable',   // 스크롤바 공간 항상 확보 (레이아웃 흔들림 방지)
      },
      body: {
        margin: 0,
        padding: 0,
        overscrollBehaviorY: 'none',
        // clip = 시각적으로만 잘라냄, 새 스크롤 컨테이너를 만들지 않음
        // hidden 은 새 스크롤 컨테이너를 만들어 휠 스크롤을 막아버림
        overflowX: 'clip',
        // backgroundColor은 CssBaseline이 theme.palette.background.default로 자동 처리
      },
    }}
  />
)

export function RootLayout({ children }: PropsWithChildren) {
  return (
    <>
      {globalStyles}
      <Box sx={{ flexDirection: 'column', minHeight: '100vh', display: 'flex' }}>
        <Banner />
        <Box
          component="main"
          sx={{
            width: '100%',
            maxWidth: 1200,
            mx: 'auto',
            px: { xs: 2, sm: 3, md: 4 },
            mt: 5,
            boxSizing: 'border-box',
          }}
        >
          {children}
        </Box>
      </Box>
    </>
  )
}
