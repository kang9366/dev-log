/**
 * Design System – MUI Theme
 *
 * colors.ts / typography.ts 토큰을 MUI createTheme 에 주입.
 * light/dark 두 색 구성을 CSS 변수로 내보냄 → 서버 렌더링 시 깜빡임 없이 모드 전환.
 * 모드별로 달라지는 값은 컴포넌트 오버라이드에서 theme.vars(CSS 변수)로 참조.
 */
import { createTheme } from '@mui/material/styles'
import { colors, primitives } from './tokens/colors'
import { fontFamily, fontWeight, typographyVariants } from './tokens/typography'

// ─── MUI 팔레트 확장 타입 ─────────────────────
declare module '@mui/material/styles' {
  interface TypographyVariants { display: React.CSSProperties; code: React.CSSProperties }
  interface TypographyVariantsOptions { display?: React.CSSProperties; code?: React.CSSProperties }
  interface PaletteColor { lighter?: string }
  interface SimplePaletteColorOptions { lighter?: string }
  interface TypeBackground { overlay: string }
}
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides { display: true; code: true }
}
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides { ghost: true }
}

// ─────────────────────────────────────────────
// 모드별 팔레트
// ─────────────────────────────────────────────
function paletteFor(mode: 'light' | 'dark') {
  const isDark = mode === 'dark'
  return {
    primary: {
      light:        colors.primary.light,
      main:         colors.primary.main,
      dark:         colors.primary.dark,
      contrastText: colors.primary.contrast,
      lighter:      isDark ? primitives.indigo[950] : colors.primary.lighter,
    },
    secondary: {
      light:        primitives.neutral[400],
      main:         primitives.neutral[600],
      dark:         primitives.neutral[800],
      contrastText: isDark ? primitives.neutral[900] : colors.text.inverse,
    },
    error:   { light: colors.error.light,   main: colors.error.main,   dark: colors.error.dark },
    warning: { light: colors.warning.light, main: colors.warning.main, dark: colors.warning.dark },
    info:    { light: colors.info.light,    main: colors.info.main,    dark: colors.info.dark },
    success: { light: colors.success.light, main: colors.success.main, dark: colors.success.dark },
    background: {
      default: isDark ? primitives.neutral[900] : colors.bg.default,
      paper:   isDark ? primitives.neutral[800] : colors.bg.paper,
      overlay: isDark ? 'rgba(255,255,255,0.06)' : colors.bg.overlay,
    },
    text: {
      primary:   isDark ? primitives.neutral[50]  : colors.text.primary,
      secondary: isDark ? primitives.neutral[400] : colors.text.secondary,
      disabled:  isDark ? primitives.neutral[600] : colors.text.disabled,
    },
    divider: isDark ? primitives.neutral[700] : colors.border.default,
    grey: primitives.neutral as Record<string, string>,
  }
}

/** 사용자가 고른 라이트/다크 모드 저장 키 (ThemeProvider, InitColorSchemeScript 공용) */
export const THEME_STORAGE_KEY = 'devlog-theme'

const focusRing = { outline: `2px solid ${colors.border.focus}`, outlineOffset: 2 }

export const theme = createTheme({
  // .light / .dark 클래스로 모드 전환 (InitColorSchemeScript attribute="class" 와 맞춤)
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: { palette: paletteFor('light') },
    dark:  { palette: paletteFor('dark') },
  },

  // ── 타이포그래피 ─────────────────────────
  typography: {
    fontFamily: fontFamily.sans,
    fontWeightRegular: fontWeight.regular,
    fontWeightMedium:  fontWeight.medium,
    fontWeightBold:    fontWeight.bold,
    display:   typographyVariants.display,
    h1:        typographyVariants.h1,
    h2:        typographyVariants.h2,
    h3:        typographyVariants.h3,
    h4:        typographyVariants.h4,
    h5:        typographyVariants.h5,
    h6:        typographyVariants.h6,
    subtitle1: typographyVariants.subtitle1,
    subtitle2: typographyVariants.subtitle2,
    body1:     typographyVariants.body1,
    body2:     typographyVariants.body2,
    caption:   typographyVariants.caption,
    overline:  typographyVariants.overline,
    code:      typographyVariants.code,
  },

  // ── Shape ───────────────────────────────
  shape: { borderRadius: 8 },

  // ── 컴포넌트 오버라이드 ──────────────────
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: false },
      styleOverrides: {
        root: {
          fontFamily: fontFamily.sans,
          fontWeight: fontWeight.medium,
          letterSpacing: '0.01em',
          textTransform: 'none',
          borderRadius: 8,
          transition: 'all 0.18s ease',
        },
        sizeSmall:  { padding: '6px 14px',  fontSize: '0.8125rem' },
        sizeMedium: { padding: '9px 20px',  fontSize: '0.9375rem' },
        sizeLarge:  { padding: '12px 28px', fontSize: '1.0625rem' },
        containedPrimary: {
          backgroundColor: colors.primary.main,
          color: colors.primary.contrast,
          '&:hover': { backgroundColor: colors.primary.dark, transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' },
          '&:active': { transform: 'translateY(0)', boxShadow: 'none' },
          '&:focus-visible': focusRing,
        },
        outlinedPrimary: ({ theme }) => ({
          border: `1.5px solid ${colors.primary.main}`,
          color: colors.primary.main,
          backgroundColor: 'transparent',
          '&:hover': { backgroundColor: (theme.vars || theme).palette.primary.lighter, borderColor: colors.primary.dark },
          '&:focus-visible': focusRing,
        }),
        textPrimary: ({ theme }) => ({
          color: colors.primary.main,
          '&:hover': { backgroundColor: (theme.vars || theme).palette.primary.lighter },
          '&:focus-visible': focusRing,
        }),
      },
      variants: [
        {
          props: { variant: 'ghost' },
          style: ({ theme }) => ({
            backgroundColor: 'transparent',
            color: (theme.vars || theme).palette.text.secondary,
            border: 'none',
            '&:hover': {
              backgroundColor: (theme.vars || theme).palette.background.overlay,
              color: (theme.vars || theme).palette.text.primary,
            },
            '&:focus-visible': focusRing,
          }),
        },
      ],
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 12,
          border: `1px solid ${(theme.vars || theme).palette.divider}`,
          boxShadow: 'none',
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontFamily: fontFamily.sans, fontWeight: fontWeight.medium, fontSize: '0.75rem', borderRadius: 6 },
      },
    },
    MuiTypography: {
      defaultProps: { variantMapping: { display: 'h1', code: 'code' } },
    },
    MuiInputBase: {
      styleOverrides: {
        root: { fontFamily: fontFamily.sans, fontSize: '0.875rem' },
      },
    },
    MuiCssBaseline: {
      styleOverrides: `
        *, *::before, *::after { box-sizing: border-box; }
        html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; scrollbar-gutter: stable; }
        body { margin: 0; padding: 0; overflow-x: clip; overscroll-behavior-y: none; }
        code, pre { font-family: ${fontFamily.mono}; }
      `,
    },
  },
})

export default theme
