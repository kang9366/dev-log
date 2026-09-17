// 글 HTML 버전에 스크립트 끼워넣기 점검. 실행: npm run check:html
import assert from 'node:assert'
import { injectIntoHtml } from '../src/feature/post/injectIntoHtml.ts'

const H = '<base>', T = '<tail>'
assert.equal(injectIntoHtml('<!DOCTYPE html><html><head><title>x</title></head><body>b</body></html>', H, T),
  '<!DOCTYPE html><html><head><base><title>x</title></head><body>b<tail></body></html>', 'head 뒤·body 끝')
assert.equal(injectIntoHtml('<title>x</title><div>b</div>', H, T),
  '<!doctype html><base><title>x</title><div>b</div><tail>', 'doctype 없는 조각: doctype 붙이고 그 뒤에')
assert.ok(injectIntoHtml('<p>x</p>', H, T).startsWith('<!doctype html>'), '항상 표준 모드')
assert.equal(injectIntoHtml('<header>h</header>', H, T), '<!doctype html><base><header>h</header><tail>', '<header> 를 <head> 로 착각하지 않음')
console.log('inject html OK')
