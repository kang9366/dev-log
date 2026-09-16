import { createCn } from 'cn/config'

/**
 * 클래스 합치기 + Tailwind 충돌 정리.
 * globals.css 의 타이포그래피 토큰(text-h1 등)을 글자 크기로 등록해야
 * text-muted-foreground 같은 글자색 클래스와 합칠 때 지워지지 않음.
 * 토큰을 추가하면 여기에도 추가할 것. shadcn 컴포넌트도 반드시 이 cn 을 import
 */
export const TYPOGRAPHY_VARIANTS = [
  'display', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'subtitle1', 'subtitle2', 'body1', 'body2', 'prose',
  'caption', 'overline', 'code',
] as const

export const cn = createCn({
  extend: { classGroups: { 'font-size': [{ text: [...TYPOGRAPHY_VARIANTS] }] } },
})
