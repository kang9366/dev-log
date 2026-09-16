'use client'
import type { Post } from '@core/domain/post'
import { useSlider } from '@core/hooks/useSlider'
import { SliderArrowButton } from '@ds/navigation/SliderArrowButton'
import { SliderDots } from '@ds/navigation/SliderDots'
import { PinnedPostCard } from '@ds/hero/PinnedPostCard'

interface PinnedPostsProps {
  posts: Post[]
  autoPlayInterval?: number
}

export function PinnedPosts({ posts, autoPlayInterval = 5000 }: PinnedPostsProps) {
  const { current, animating, direction, go, prev, next } = useSlider({
    total: posts.length,
    autoPlayInterval,
  })

  return (
    <section aria-roledescription="carousel" aria-label="고정 포스트" className="w-full select-none">
      <div className="relative grid grid-cols-1 sm:min-h-[380px] md:min-h-[420px] md:grid-cols-2">
        <PinnedPostCard post={posts[current]} index={current} animating={animating} direction={direction} />
        <SliderArrowButton direction="left" onClick={prev} />
        <SliderArrowButton direction="right" onClick={next} />
      </div>
      <SliderDots total={posts.length} current={current} onDotClick={go} />
    </section>
  )
}

export default PinnedPosts
