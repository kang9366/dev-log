export interface RecentPost {
  id: number
  slug: string        // MDX 파일명 (확장자 제외)
  tag: string
  title: string
  excerpt: string
  imageUrl: string
  commentCount: number
  likeCount: number
  date: string
}

export const recentPosts: RecentPost[] = [
  {
    id: 1,
    slug: '1-framer-motion-scroll-restoration',
    tag: 'react',
    title: 'Framer Motion 전환과 scrollRestoration 충돌 문제 해결 fix : Double rAF 기반 스크롤 복원',
    excerpt:
      "브라우저는 최적의 사용자 UX 위해, 상세 페이지에서 '뒤로 가기'를 했을 때 이전 스크롤 위치를 자동으로 복원하는 기능을 제공합니다...",
    imageUrl: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&q=80',
    commentCount: 0,
    likeCount: 0,
    date: '25. 11. 19',
  },
  {
    id: 2,
    slug: '2-nextjs-server-actions',
    tag: 'next.js',
    title: 'Next.js App Router에서 Server Actions 완벽 이해하기',
    excerpt:
      'Server Actions는 Next.js 13.4부터 안정화된 기능으로, 클라이언트에서 직접 서버 함수를 호출할 수 있게 해줍니다...',
    imageUrl: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=800&q=80',
    commentCount: 3,
    likeCount: 12,
    date: '25. 11. 10',
  },
  {
    id: 3,
    slug: '3-typescript-utility-patterns',
    tag: 'typescript',
    title: 'Type Safety를 높이는 TS 유틸리티 패턴 7선',
    excerpt:
      'Pick, Omit, ReturnType, satisfies 등을 조합해 복잡한 도메인 모델을 안전하게 다루는 방법을 정리합니다...',
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&q=80',
    commentCount: 5,
    likeCount: 8,
    date: '25. 11. 05',
  },
  {
    id: 4,
    slug: '4-css-grid-responsive',
    tag: 'css',
    title: 'CSS Grid로 반응형 카드 그리드 최적화하기',
    excerpt:
      'Grid 템플릿과 minmax, auto-fit을 활용해 카드 레이아웃을 단순화하는 방법을 공유합니다...',
    imageUrl: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=900&q=80',
    commentCount: 1,
    likeCount: 3,
    date: '25. 10. 28',
  },
  {
    id: 5,
    slug: '5-web-vitals-ab-testing',
    tag: 'performance',
    title: 'Web Vitals를 A/B 실험에 활용하는 방법',
    excerpt:
      'LCP, INP, CLS를 실험 지표로 설정하고 최적화 결과를 정량적으로 비교하는 워크플로우를 정리합니다...',
    imageUrl: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?w=800&q=80',
    commentCount: 2,
    likeCount: 6,
    date: '25. 10. 20',
  },
  {
    id: 6,
    slug: '6-react-19-transition',
    tag: 'react',
    title: 'React 19 Transition 최적화 실전 가이드',
    excerpt:
      'Concurrent 렌더링 환경에서 Transition과 Suspense를 조합해 UX와 성능을 동시에 잡는 전략을 소개합니다...',
    imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=900&q=80',
    commentCount: 4,
    likeCount: 10,
    date: '25. 10. 12',
  },
]
