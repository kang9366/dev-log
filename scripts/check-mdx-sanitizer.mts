// MDX 본문 JS 제거 플러그인 자가 점검. 실행: npm run check:mdx
import assert from 'node:assert'
import { compile } from '@mdx-js/mdx'
import { remarkSafeMdx } from '../src/lib/remarkSafeMdx.ts'

const evil = `import fs from 'fs'
export const x = globalThis.process

{fetch('https://evil')}

text {alert(1)} end

<script>alert(2)</script>

<Button onClick="x">btn</Button>

<img src="javascript:alert(3)" onError="alert(4)" style="color:red" width="100%" data-img-id="a" />

<span data-color="#ef4444" style={{ color: 'red' }} {...props}>빨강</span>

<a href="javascript:alert(5)">link</a>
`
const out = String(await compile(evil, { outputFormat: 'function-body', remarkPlugins: [remarkSafeMdx] }))

for (const bad of ['fetch(', 'alert(1)', 'alert(3)', 'alert(4)', 'alert(5)', 'globalThis', "'fs'", 'Button', '"script"', 'onError', 'javascript:', "'red'", 'color:red']) {
  assert(!out.includes(bad), `leaked: ${bad}`)
}
assert(out.includes('"alert(2)"'), '<script> 내용은 일반 텍스트로만 남아야 함')
assert(out.includes('"data-color": "#ef4444"'), '허용 속성 유지')
assert(out.includes('"data-img-id": "a"'), '허용 속성 유지')
console.log('mdx sanitizer OK')
