import { cn } from '@/lib/utils'

export interface SliderDotsProps {
  total: number
  current: number
  onDotClick: (index: number) => void
}

export function SliderDots({ total, current, onDotClick }: SliderDotsProps) {
  return (
    <div className="mt-5 flex justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onDotClick(i)}
          aria-label={`슬라이드 ${i + 1}`}
          aria-current={i === current}
          className={cn(
            'h-1.5 cursor-pointer rounded-[3px] transition-[background-color,width] duration-200 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
            i === current
              ? 'w-9 bg-neutral-600 hover:bg-neutral-700 dark:bg-neutral-300 dark:hover:bg-neutral-200'
              : 'w-7 bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-700 dark:hover:bg-neutral-600',
          )}
        />
      ))}
    </div>
  )
}
