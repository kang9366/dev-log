// 에디터 표 위젯의 마크다운 ↔ 모델 변환 점검. 실행: npm run check:table
import assert from 'node:assert'
import { parseTable, serializeTable } from '../src/feature/editor/tableWidget.ts'

const src = [
  '| Prop | 타입 | 기본값 |',
  '| :--- | :---: | ---: |',
  "| `variant` | `'a' \\| 'b'` | `'a'` |",
  '| `size` | | |',
].join('\n')

const m = parseTable(src)
assert.deepEqual(m.align, ['left', 'center', 'right'], '정렬 보존')
assert.deepEqual(m.rows[1], ['`variant`', "`'a' | 'b'`", "`'a'`"], '이스케이프된 | 는 셀 안 문자로')
assert.deepEqual(m.rows[2], ['`size`', '', ''], '빈 셀 유지')
assert.equal(serializeTable(m), src, '왕복 변환 동일')

// 앞뒤 파이프 없는 GFM 표, 열 수가 모자란 행
const loose = parseTable('a | b\n--- | ---\n1')
assert.deepEqual(loose.rows, [['a', 'b'], ['1', '']], '열 수를 헤더에 맞춤')
console.log('table markdown OK')
