import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SliderArrowButtonProps {
  direction: 'left' | 'right'
  onClick: () => void
  ariaLabel?: string
  className?: string
}

export function SliderArrowButton({ direction, onClick, ariaLabel, className }: SliderArrowButtonProps) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      aria-label={ariaLabel ?? (direction === 'left' ? '이전' : '다음')}
      className={cn(
        'absolute top-1/2 z-10 size-10 -translate-y-1/2 rounded-full bg-card shadow-[0_2px_12px_rgba(0,0,0,0.10)]',
        'hover:scale-[1.07] hover:bg-muted hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)] active:not-aria-[haspopup]:-translate-y-1/2',
        direction === 'left' ? 'left-2 sm:left-3 md:left-4' : 'right-2 sm:right-3 md:right-4',
        className,
      )}
    >
      <Icon className="size-5" />
    </Button>
  )
}
