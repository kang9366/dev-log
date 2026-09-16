import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '@/lib/utils'

/**
 * 디자인 시스템 텍스트 컴포넌트.
 * 크기·줄간격·자간·굵기는 globals.css 의 --text-{variant} 토큰에서 옴.
 *
 *   <Typography variant="h2">제목</Typography>             → <h2>
 *   <Typography variant="h1" as="h2">                      → 스타일 h1, 태그 h2
 *   <Typography variant="body2" color="muted" clamp={2}>   → 2줄 말줄임
 *   <Typography variant="caption" asChild><time …/></Typography>
 */
const typographyVariants = cva('', {
  variants: {
    variant: {
      display:   'text-display',
      h1:        'text-h1',
      h2:        'text-h2',
      h3:        'text-h3',
      h4:        'text-h4',
      h5:        'text-h5',
      h6:        'text-h6',
      subtitle1: 'text-subtitle1',
      subtitle2: 'text-subtitle2',
      body1:     'text-body1',
      body2:     'text-body2',
      prose:     'text-prose',
      caption:   'text-caption',
      overline:  'text-overline uppercase',
      code:      'text-code font-mono',
    },
    color: {
      default:     '',
      muted:       'text-muted-foreground',
      subtle:      'text-neutral-400',
      primary:     'text-primary',
      destructive: 'text-destructive',
    },
    clamp: {
      none: '',
      1: 'line-clamp-1',
      2: 'line-clamp-2',
      3: 'line-clamp-3',
    },
  },
  defaultVariants: { variant: 'body1', color: 'default', clamp: 'none' },
})

type Variant = NonNullable<VariantProps<typeof typographyVariants>['variant']>

const defaultElement: Record<Variant, React.ElementType> = {
  display: 'h1', h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6',
  subtitle1: 'p', subtitle2: 'p', body1: 'p', body2: 'p', prose: 'p',
  caption: 'span', overline: 'span', code: 'code',
}

type TypographyProps = Omit<React.HTMLAttributes<HTMLElement>, 'color'> &
  VariantProps<typeof typographyVariants> & {
    /** 렌더할 태그 (기본: variant 에 맞는 태그) */
    as?: React.ElementType
    /** 자식 요소에 스타일만 입힘 */
    asChild?: boolean
  }

function Typography({ variant, color, clamp, as, asChild, className, ...props }: TypographyProps) {
  const Comp = asChild ? Slot.Root : (as ?? defaultElement[variant ?? 'body1'])
  return (
    <Comp
      data-slot="typography"
      className={cn(typographyVariants({ variant, color, clamp }), className)}
      {...props}
    />
  )
}

export { Typography, typographyVariants }
