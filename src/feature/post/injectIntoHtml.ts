/** 업로드한 HTML 문서 앞뒤에 스크립트 끼워넣기. doctype 은 맨 앞에 있어야 표준 모드 */
export function injectIntoHtml(doc: string, head: string, tail: string): string {
  let out = /<!doctype/i.test(doc) ? doc : `<!doctype html>${doc}`
  out = /<head(\s[^>]*)?>/i.test(out)
    ? out.replace(/<head(\s[^>]*)?>/i, (m) => m + head)
    : out.replace(/<!doctype[^>]*>/i, (m) => m + head)
  return /<\/body>/i.test(out) ? out.replace(/<\/body>/i, `${tail}</body>`) : out + tail
}
