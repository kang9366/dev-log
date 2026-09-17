// 에디터 이미지 위젯의 이미지 줄 인식·너비 반영 점검. 실행: npm run check:image
import assert from 'node:assert'
import { parseImageLine, withWidth } from '../src/feature/editor/imageWidget.ts'

const html = '<img src="https://x.co/a.png" alt="a" width="100%" data-img-id="img-1" />'
assert.deepEqual(parseImageLine(html), { src: 'https://x.co/a.png', alt: 'a', width: '100%' })
assert.equal(withWidth(html, 320), '<img src="https://x.co/a.png" alt="a" width="320px" data-img-id="img-1" />', 'width 교체, 다른 속성 유지')
assert.equal(withWidth('<img src="s.png" />', 200), '<img width="200px" src="s.png" />', 'width 없으면 추가')

assert.deepEqual(parseImageLine('![고양이](https://x.co/c.jpg "title")'), { src: 'https://x.co/c.jpg', alt: '고양이', width: null })
assert.equal(withWidth('![고양이](https://x.co/c.jpg)', 400), '<img src="https://x.co/c.jpg" alt="고양이" width="400px" />', '마크다운 → img')

assert.equal(parseImageLine('글 사이 ![a](b.png) 인라인'), null, '줄 전체가 이미지일 때만')
assert.equal(parseImageLine('<img alt="no src" />'), null, 'src 없으면 무시')
console.log('image markdown OK')
