/**
 * Design System – Public API
 *
 * import { Button, Text, theme, colors, ... } from '@ds'
 */

// ── Tokens ────────────────────────────────────────────
export { colors, primitives } from './tokens/colors'
export type { Colors } from './tokens/colors'

export {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  typographyVariants,
} from './tokens/typography'
export type { TypographyVariant } from './tokens/typography'

// ── Theme ─────────────────────────────────────────────
export { theme, createAppTheme } from './theme'

// ── Components ────────────────────────────────────────
export { Button } from './components/Button'
export type { ButtonProps, ButtonVariant, ButtonSize, ButtonColor } from './components/Button'

export { Text } from './components/Typography'
export type { TextProps } from './components/Typography'

// ── Cards ─────────────────────────────────────────────
export { BlogPostCard } from './cards/BlogPostCard'
export type { BlogPostCardProps } from './cards/BlogPostCard'

// ── Hero ──────────────────────────────────────────────
export { PinnedPostCard } from './hero/PinnedPostCard'
export type { PinnedPostCardProps } from './hero/PinnedPostCard'

