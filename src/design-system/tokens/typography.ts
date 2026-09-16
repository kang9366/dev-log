/**
 * Design System – Typography Tokens
 *
 * Font: Inter (Google Fonts)
 * Scale: T-shirt sizing (xs → 4xl) + semantic aliases
 */

// ─────────────────────────────────────────────
// Font Families
// ─────────────────────────────────────────────
export const fontFamily = {
  sans: [
    'var(--font-inter)', // next/font 로 로드한 Inter
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(', '),
  mono: [
    '"JetBrains Mono"',
    '"Fira Code"',
    '"Cascadia Code"',
    'Menlo',
    'Monaco',
    '"Courier New"',
    'monospace',
  ].join(', '),
} as const

// ─────────────────────────────────────────────
// Font Weight
// ─────────────────────────────────────────────
export const fontWeight = {
  regular:   400,
  medium:    500,
  semibold:  600,
  bold:      700,
  extrabold: 800,
} as const

// ─────────────────────────────────────────────
// Font Size Scale  (rem)
// ─────────────────────────────────────────────
export const fontSize = {
  xs:   '0.75rem',   //  12px
  sm:   '0.875rem',  //  14px
  base: '1rem',      //  16px
  lg:   '1.125rem',  //  18px
  xl:   '1.25rem',   //  20px
  '2xl': '1.5rem',   //  24px
  '3xl': '1.875rem', //  30px
  '4xl': '2.25rem',  //  36px
  '5xl': '3rem',     //  48px
} as const

// ─────────────────────────────────────────────
// Line Height
// ─────────────────────────────────────────────
export const lineHeight = {
  none:   1,
  tight:  1.25,
  snug:   1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose:  2,
} as const

// ─────────────────────────────────────────────
// Letter Spacing
// ─────────────────────────────────────────────
export const letterSpacing = {
  tight:   '-0.04em',
  snug:    '-0.02em',
  normal:  '0em',
  wide:    '0.02em',
  wider:   '0.05em',
  widest:  '0.1em',
} as const

// ─────────────────────────────────────────────
// Semantic Typography Variants
// (MUI variant → token 매핑)
// ─────────────────────────────────────────────
export const typographyVariants = {
  /** 히어로 섹션 대형 제목 */
  display: {
    fontSize:      fontSize['5xl'],
    fontWeight:    fontWeight.bold,
    lineHeight:    lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  h1: {
    fontSize:      fontSize['4xl'],
    fontWeight:    fontWeight.bold,
    lineHeight:    lineHeight.tight,
    letterSpacing: letterSpacing.snug,
  },
  h2: {
    fontSize:      fontSize['3xl'],
    fontWeight:    fontWeight.bold,
    lineHeight:    lineHeight.snug,
    letterSpacing: letterSpacing.snug,
  },
  h3: {
    fontSize:      fontSize['2xl'],
    fontWeight:    fontWeight.semibold,
    lineHeight:    lineHeight.snug,
    letterSpacing: letterSpacing.snug,
  },
  h4: {
    fontSize:      fontSize.xl,
    fontWeight:    fontWeight.semibold,
    lineHeight:    lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontSize:      fontSize.lg,
    fontWeight:    fontWeight.semibold,
    lineHeight:    lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    fontSize:      fontSize.base,
    fontWeight:    fontWeight.semibold,
    lineHeight:    lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  subtitle1: {
    fontSize:      fontSize.base,
    fontWeight:    fontWeight.medium,
    lineHeight:    lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  subtitle2: {
    fontSize:      fontSize.sm,
    fontWeight:    fontWeight.medium,
    lineHeight:    lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  body1: {
    fontSize:      fontSize.base,
    fontWeight:    fontWeight.regular,
    lineHeight:    lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  body2: {
    fontSize:      fontSize.sm,
    fontWeight:    fontWeight.regular,
    lineHeight:    lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
  caption: {
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.regular,
    lineHeight:    lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  },
  overline: {
    fontSize:      fontSize.xs,
    fontWeight:    fontWeight.medium,
    lineHeight:    lineHeight.normal,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase' as const,
  },
  code: {
    fontFamily:    fontFamily.mono,
    fontSize:      fontSize.sm,
    fontWeight:    fontWeight.regular,
    lineHeight:    lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  },
} as const

export type TypographyVariant = keyof typeof typographyVariants

