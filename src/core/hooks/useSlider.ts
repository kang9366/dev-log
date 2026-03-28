import { useState, useEffect, useCallback } from 'react'

interface UseSliderOptions {
  total: number
  autoPlayInterval?: number
}

interface UseSliderReturn {
  current: number
  animating: boolean
  direction: 'left' | 'right'
  go: (next: number) => void
  prev: () => void
  next: () => void
}

export function useSlider({ total, autoPlayInterval = 5000 }: UseSliderOptions): UseSliderReturn {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'left' | 'right'>('right')

  const go = useCallback(
    (next: number) => {
      if (animating) return
      setDirection(next > current ? 'right' : 'left')
      setAnimating(true)
      setTimeout(() => {
        setCurrent(next)
        setAnimating(false)
      }, 350)
    },
    [animating, current]
  )

  const prev = useCallback(() => go((current - 1 + total) % total), [current, go, total])

  const next = useCallback(() => go((current + 1) % total), [current, go, total])

  useEffect(() => {
    const timer = setInterval(() => go((current + 1) % total), autoPlayInterval)
    return () => clearInterval(timer)
  }, [current, go, total, autoPlayInterval])

  return { current, animating, direction, go, prev, next }
}

