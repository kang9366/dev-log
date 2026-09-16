// 타이포그래피 토큰이 cn 병합에서 살아남는지 점검. 실행: npm run check:cn
import assert from 'node:assert'
import { cn, TYPOGRAPHY_VARIANTS } from '../src/lib/utils.ts'

for (const v of TYPOGRAPHY_VARIANTS) {
  assert.equal(cn(`text-${v}`, 'text-muted-foreground'), `text-${v} text-muted-foreground`, `${v}: 글자색과 합칠 때 사라짐`)
}
assert.equal(cn('text-body2', 'text-caption'), 'text-caption', '크기끼리는 뒤쪽만 남아야 함')
assert.equal(cn('text-sm', 'text-h1'), 'text-h1', 'Tailwind 기본 크기와도 충돌 처리')
console.log('cn typography merge OK')
