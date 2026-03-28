/**
 * Design System – Typography Component
 *
 * MUI Typography 래퍼.
 * 디자인 시스템 토큰 기반의 variant + 추가 편의 prop 제공.
 *
 * 사용 예:
 *   <Text variant="h2">제목</Text>
 *   <Text variant="body1" color="secondary">본문</Text>
 *   <Text variant="code">const x = 1</Text>
 *   <Text variant="overline">LABEL</Text>
 */
import {
  Typography,
  type TypographyProps,
  type SxProps,
  type Theme,
} from '@mui/material'
import type { ElementType } from 'react'

// MUI 기본 variant + 커스텀 variant
type Variant =
  | 'display'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'subtitle1' | 'subtitle2'
  | 'body1' | 'body2'
  | 'caption' | 'overline'
  | 'code'

type ColorAlias =
  | 'primary'
  | 'secondary'
  | 'disabled'
  | 'inverse'
  | 'link'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'

// color alias → MUI color prop 매핑
const colorMap: Record<ColorAlias, TypographyProps['color']> = {
  primary:   'text.primary',
  secondary: 'text.secondary',
  disabled:  'text.disabled',
  inverse:   'common.white',
  link:      'primary.main',
  success:   'success.main',
  error:     'error.main',
  warning:   'warning.main',
  info:      'info.main',
}

export interface TextProps extends Omit<TypographyProps, 'variant' | 'color'> {
  variant?: Variant
  /** 색상 alias or MUI color string */
  color?: ColorAlias | string
  /** 말줄임 line 수 (WebkitLineClamp) */
  clamp?: number
  /** 인라인 표시 */
  inline?: boolean
  /** 렌더링 HTML 태그 오버라이드 */
  as?: ElementType
}

export function Text({
  variant = 'body1',
  color = 'primary',
  clamp,
  inline = false,
  as,
  sx,
  children,
  ...props
}: TextProps) {
  const resolvedColor = colorMap[color as ColorAlias] ?? color

  const clampSx: SxProps<Theme> = clamp
    ? {
        display: '-webkit-box',
        WebkitLineClamp: clamp,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }
    : {}

  return (
    <Typography
      variant={variant as TypographyProps['variant']}
      color={resolvedColor}
      component={as ?? (inline ? 'span' : undefined)}
      sx={{ ...clampSx, ...sx }}
      {...props}
    >
      {children}
    </Typography>
  )
}

export default Text



