import type { Post } from '@core/domain/post'

export const pinnedPosts: Post[] = [
  {
    id: 1,
    category: 'web',
    title: 'Web Vitals,\n프론트엔드의 필수 역량',
    excerpt:
      'Web Vitals, 프론트엔드의 필수 역량프론트엔드 개발자에게 Web Vitals는 더 이상 \"알면 좋은 교양\"이 아닌, 반드시 갖춰야 할 \"필수 역량\"이다. 웹페이지는 단순히 CSS의 플로우에 따라 순서대로 페인팅되어 사용자에게 …',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&q=80',
    href: '/posts/web-vitals',
  },
  {
    id: 2,
    category: 'react',
    title: 'React 18의\n새로운 기능들',
    excerpt:
      'React 18이 정식 출시되며 Concurrent Features, Suspense, Transitions 등 다양한 기능이 추가되었다. 이 글에서는 주요 변경 사항과 실무 적용 방법을 살펴본다 …',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=900&q=80',
    href: '/posts/react-18',
  },
  {
    id: 3,
    category: 'performance',
    title: 'Next.js로\n성능 최적화하기',
    excerpt:
      'Next.js는 SSR, SSG, ISR 등 다양한 렌더링 전략을 제공한다. 각 전략의 차이를 이해하고 상황에 맞게 선택하는 것이 성능 최적화의 핵심이다 …',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&q=80',
    href: '/posts/nextjs-performance',
  },
  {
    id: 4,
    category: 'css',
    title: 'CSS Grid로\n레이아웃 마스터하기',
    excerpt:
      'Flexbox와 Grid는 현대 CSS 레이아웃의 양대 산맥이다. 특히 CSS Grid는 2차원 레이아웃을 손쉽게 구현할 수 있어 복잡한 페이지 구조에 매우 유용하다 …',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=900&q=80',
    href: '/posts/css-grid',
  },
  {
    id: 5,
    category: 'typescript',
    title: 'TypeScript\n실전 패턴 모음',
    excerpt:
      'TypeScript를 실무에서 효과적으로 활용하려면 단순한 타입 선언을 넘어 Generic, Utility Types, Conditional Types 등을 능숙하게 다뤄야 한다 …',
    image: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=900&q=80',
    href: '/posts/typescript-patterns',
  },
]

