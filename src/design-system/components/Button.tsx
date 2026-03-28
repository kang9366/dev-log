/**
 * Design System – Button Component
 * MUI Button 래퍼. variant: contained | outlined | text | ghost
 */
import {
  Button as MuiButton,
  CircularProgress,
  type ButtonProps as MuiButtonProps,
} from '@mui/material'
import type { ReactNode } from 'react'

export type ButtonVariant = 'contained' | 'outlined' | 'text' | 'ghost'
export type ButtonSize    = 'small' | 'medium' | 'large'
export type ButtonColor   = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

export interface ButtonProps extends Omit<MuiButtonProps, 'variant' | 'size' | 'color'> {
  variant?: ButtonVariant
  size?: ButtonSize
  color?: ButtonColor
  /** 로딩 상태 - spinner 표시 + disabled 처리 */
  loading?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
  fullWidth?: boolean
  children: ReactNode
}

export function Button({
  variant = 'contained',
  size = 'medium',
  color = 'primary',
  loading = false,
  disabled,
  startIcon,
  endIcon,
  fullWidth = false,
  children,
  sx,
  ...props
}: ButtonProps) {
  const isGhost = variant === 'ghost'

  return (
    <MuiButton
      variant={isGhost ? ('ghost' as MuiButtonProps['variant']) : (variant as MuiButtonProps['variant'])}
      size={size}
      color={isGhost ? undefined : color}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      startIcon={loading ? undefined : startIcon}
      endIcon={loading ? undefined : endIcon}
      sx={{ position: 'relative', ...sx }}
      {...props}
    >
      {loading ? (
        <>
          {/* 텍스트를 투명하게 유지해 버튼 너비 고정 */}
          <span style={{ visibility: 'hidden' }}>{children}</span>
          <CircularProgress
            size={size === 'small' ? 14 : size === 'large' ? 20 : 16}
            color="inherit"
            sx={{ position: 'absolute' }}
          />
        </>
      ) : (
        children
      )}
    </MuiButton>
  )
}

export default Button
