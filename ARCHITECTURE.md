# DevLog 클린 아키텍처 가이드

본 문서는 기존 Vite + React + TypeScript + MUI 프로젝트를 클린 아키텍처 스타일로 정리하기 위한 설계안입니다. 인프라(API 연동 등)는 제외하고, 앱 셸·도메인·피처·디자인 시스템 중심으로 구조를 재배치합니다. Tailwind는 사용하지 않는 방향으로 일원화합니다.

## 목표
- 관심사 분리: 앱 셸(전역 레이아웃) / 도메인(엔티티·유스케이스) / 피처(UI 조합) / 디자인 시스템(재사용 UI)
- 재사용성: 공통 훅·UI 프리미티브를 design-system/core로 올리고, 피처는 조립만 담당
- 경로 일관성: 별칭(alias)로 계층 간 참조를 명확히

## 제안 폴더 구조 (인프라 제외)
```
src/
  app/
    shell/
      RootLayout.tsx        # 전역 스타일, 레이아웃, 헤더 배치
      Banner.tsx            # 상단 네비게이션/검색
    main.tsx                # 진입점(StrictMode + RootLayout + 라우트 루트)
  core/
    domain/
      post.ts               # Post 엔티티 타입
    use-cases/
      toggleLike.ts         # 좋아요 토글 규칙 (상태/카운트 계산)
    hooks/
      useSlider.ts          # 슬라이더 공통 훅
  design-system/
    navigation/
      SliderArrowButton.tsx
      SliderDots.tsx
    cards/
      BlogPostCard.tsx
    hero/
      PinnedPostCard.tsx
    buttons/                # (필요시 MUI variant로 확장)
  feature/
    home/
      Home.tsx              # 페이지 컨테이너, 상태 조립
      PinnedPosts.tsx       # 고정 포스트 섹션
      mocks/
        pinnedPosts.ts
  layout/                   # (레거시, 현재는 re-export)
  assets/
  index.css                 # 전역 스타일 진입 (src 루트 유지)
  App.tsx                   # Vite 템플릿 엔트리, 현재는 Home을 re-export
```

## 코드 이동/정리 플랜
1) 앱 셸 이동
- `src/main.tsx` → import 경로를 `@app/shell/RootLayout`, `@feature/home/Home`로 수정
- `src/layout/RootLayout.tsx`, `src/Banner.tsx` → `src/app/shell/`

2) 도메인·유스케이스
- `src/Post.ts` → `src/core/domain/post.ts`
- `toggleLike` 유스케이스 추가: 좋아요 on/off 시 카운트 증감 로직을 순수 함수로 분리 (Home에서 호출)

3) 공통 훅
- `src/UseSlider.ts` → `src/core/hooks/useSlider.ts`

4) 디자인 시스템
- 슬라이더 화살표/도트: `src/SliderarrowButton.tsx`, `src/Sliderdots.tsx` → `src/design-system/navigation/`
- 카드: `src/BlogPostCards.tsx` → `src/design-system/cards/BlogPostCard.tsx`
- 고정 포스트 카드: `src/PinnedPostcard.tsx` → `src/design-system/hero/PinnedPostCard.tsx`
- `design-system/components/Header.tsx`는 Next.js 의존이므로 정리하거나 MUI 기반으로 대체 (Vite 기준 불일치)
- Tailwind 기반 `design-system/components/Button.tsx`는 필요 시 `design-system/buttons/Button.tsx`로 편입; MUI 일원화를 원한다면 추후 제거

5) 피처 계층
- `src/Home.tsx`, `src/PinnedPosts.tsx` → `src/feature/home/`
- 목업 데이터는 `src/feature/home/mocks/`로 분리하여 UI 로직과 데이터 분리

6) 경로 별칭 (제안)
- `tsconfig.json` / `vite.config.ts`에 다음 alias 추가
  - `@app/*` → `src/app/*`
  - `@core/*` → `src/core/*`
  - `@feature/*` → `src/feature/*`
  - `@ds/*` → `src/design-system/*`

7) 정리 대상
- `src/App.tsx`: 기존 템플릿 코드, 사용 안 하면 제거
- `src/layout/` 폴더: RootLayout 이동 후 비우기
- `src/output.css`: Tailwind 워치 산출물, Git 관리 제외(.gitignore) 고려

## 디자인 시스템 방향 (확정)
- MUI 일원화: Vite 설정에서 Tailwind PostCSS 플러그인 제거, Tailwind 전역 사용 중단. Tailwind 기반 컴포넌트는 필요 시 MUI variant로 재구현.

## 단계별 마이그레이션 체크리스트
- [ ] 폴더 생성: app/shell, core/domain|use-cases|hooks, design-system/navigation|cards|hero, feature/home/mocks
- [ ] 파일 이동 및 이름 정리 (위 표준 구조)
- [ ] import 경로 alias 적용 및 모든 참조 수정
- [ ] 불일치 코드 정리: Next.js `Link` 사용 컴포넌트 교체/삭제
- [ ] 불필요 템플릿/산출물 정리 (`App.tsx`, `output.css` 등)
- [ ] 런타임 확인: `npm run lint`, `npm run build`, `npm run dev`

## 유스케이스 예시 스텁 (참고)
```ts
// src/core/use-cases/toggleLike.ts
export type LikeState = Record<number, boolean>;
export type LikeCounts = Record<number, number>;

export function toggleLike(
  id: number,
  liked: LikeState,
  counts: LikeCounts
): { liked: LikeState; counts: LikeCounts } {
  const nextLiked = { ...liked, [id]: !liked[id] };
  const delta = nextLiked[id] ? 1 : -1;
  return {
    liked: nextLiked,
    counts: { ...counts, [id]: (counts[id] ?? 0) + delta },
  };
}
```

## 진행 제안
- 위 구조/옵션에 합의하면, 다음 단계에서 실제 경로 이동과 alias 설정을 적용하고 빌드/린트 검증을 수행합니다. 인프라(API 연동)는 추후 필요 시 별도 단계에서 추가합니다.


