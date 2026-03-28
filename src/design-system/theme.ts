/**
 * Design System – MUI Theme
 *
 * colors.ts / typography.ts 토큰을 MUI createTheme 에 주입.
 * ThemeProvider 로 앱 최상단에 감싸서 사용하세요.
 */
import { createTheme } from '@mui/material/styles'
import { colors, primitives } from './tokens/colors'
import { fontFamily, fontWeight, typographyVariants } from './tokens/typography'

// ─── MUI 팔레트 확장 타입 ─────────────────────
declare module '@mui/material/styles' {
  interface TypographyVariants { display: React.CSSProperties; code: React.CSSProperties }
  interface TypographyVariantsOptions { display?: React.CSSProperties; code?: React.CSSProperties }
}
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides { display: true; code: true }
}
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides { ghost: true }
}

// ─────────────────────────────────────────────
// createAppTheme – mode 별 토큰 분기
// ─────────────────────────────────────────────
export function createAppTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark'

  // ── 모드별 resolved 토큰 ──────────────────
  const bg = {
    default: isDark ? primitives.neutral[900] : colors.bg.default,
    paper:   isDark ? primitives.neutral[800] : colors.bg.paper,
    overlay: isDark ? 'rgba(255,255,255,0.06)' : colors.bg.overlay,
  }
  const text = {
    primary:   isDark ? primitives.neutral[50]  : colors.text.primary,
    secondary: isDark ? primitives.neutral[400] : colors.text.secondary,
    disabled:  isDark ? primitives.neutral[600] : colors.text.disabled,
    inverse:   isDark ? primitives.neutral[900] : colors.text.inverse,
    link:      isDark ? primitives.indigo[300]  : colors.text.link,
  }
  const border = {
    default: isDark ? primitives.neutral[700] : colors.border.default,
    strong:  isDark ? primitives.neutral[600] : colors.border.strong,
    focus:   colors.border.focus,
  }
  const primaryLighter = isDark ? primitives.indigo[950] : colors.primary.lighter

  return createTheme({
    // ── 팔레트 ──────────────────────────────
    palette: {
      mode,
      primary: {
        light:        colors.primary.light,
        main:         colors.primary.main,
        dark:         colors.primary.dark,
        contrastText: colors.primary.contrast,
      },
      secondary: {
        light:        primitives.neutral[400],
        main:         primitives.neutral[600],
        dark:         primitives.neutral[800],
        contrastText: text.inverse,
      },
      error:   { light: colors.error.light,   main: colors.error.main,   dark: colors.error.dark },
      warning: { light: colors.warning.light, main: colors.warning.main, dark: colors.warning.dark },
      info:    { light: colors.info.light,    main: colors.info.main,    dark: colors.info.dark },
      success: { light: colors.success.light, main: colors.success.main, dark: colors.success.dark },
      background: { default: bg.default, paper: bg.paper },
      text: { primary: text.primary, secondary: text.secondary, disabled: text.disabled },
      divider: border.default,
      grey: primitives.neutral as Record<string, string>,
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
            '&:focus-visible': { outline: `2px solid ${border.focus}`, outlineOffset: 2 },
          },
          outlinedPrimary: {
            border: `1.5px solid ${colors.primary.main}`,
            color: colors.primary.main,
            backgroundColor: 'transparent',
            '&:hover': { backgroundColor: primaryLighter, borderColor: colors.primary.dark },
            '&:focus-visible': { outline: `2px solid ${border.focus}`, outlineOffset: 2 },
          },
          textPrimary: {
            color: colors.primary.main,
            '&:hover': { backgroundColor: primaryLighter },
            '&:focus-visible': { outline: `2px solid ${border.focus}`, outlineOffset: 2 },
          },
        },
        variants: [
          {
            props: { variant: 'ghost' },
            style: {
              backgroundColor: 'transparent',
              color: text.secondary,
              border: 'none',
              '&:hover': { backgroundColor: bg.overlay, color: text.primary },
              '&:focus-visible': { outline: `2px solid ${border.focus}`, outlineOffset: 2 },
            },
          },
        ],
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: 12, border: `1px solid ${border.default}`, boxShadow: 'none' },
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
}

// 하위 호환 – 기존 import { theme } from '@ds/theme' 유지
export const theme = createAppTheme('light')
export default theme


