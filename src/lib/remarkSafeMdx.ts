/**
 * MDX 본문에서 JS 실행 경로 제거 (remark 플러그인).
 * 본문은 서버 렌더링 중에도 실행되므로, 관리자 계정이 뚫려도 임의 코드가 돌지 않게 막음.
 *
 * - import/export, {표현식} 제거
 * - JSX 는 허용 태그만. 그 외 태그는 껍데기를 벗기고 내용만 남김
 * - JSX 속성은 문자열 값만. on* 이벤트, style(문자열이면 React 가 에러), javascript: URL 제거
 */
interface MdxNode {
  type: string
  name?: string | null
  children?: MdxNode[]
  attributes?: { type: string; name?: string; value?: unknown }[]
}

const BLOCKED_NODES = new Set(['mdxjsEsm', 'mdxFlowExpression', 'mdxTextExpression'])
const JSX_NODES = new Set(['mdxJsxFlowElement', 'mdxJsxTextElement'])
const ALLOWED_TAGS = new Set(['img', 'span', 'br', 'sup', 'sub', 'kbd', 'mark', 'u', 'details', 'summary', 'div', 'figure', 'figcaption'])
const URL_ATTRS = new Set(['href', 'src'])

function isSafeAttribute(attr: { type: string; name?: string; value?: unknown }) {
  if (attr.type !== 'mdxJsxAttribute' || !attr.name) return false          // {...spread} 제거
  if (attr.value != null && typeof attr.value !== 'string') return false    // name={expr} 제거
  if (/^on/i.test(attr.name) || attr.name === 'style') return false
  if (URL_ATTRS.has(attr.name) && typeof attr.value === 'string' && /^\s*javascript:/i.test(attr.value)) return false
  return true
}

function sanitize(node: MdxNode): MdxNode[] {
  if (BLOCKED_NODES.has(node.type)) return []

  const children = (node.children ?? []).flatMap(sanitize)

  if (JSX_NODES.has(node.type)) {
    // <>fragment</> 또는 허용 안 된 태그 → 내용만 남김
    if (!node.name || !ALLOWED_TAGS.has(node.name)) return children
    node.attributes = (node.attributes ?? []).filter(isSafeAttribute)
  }

  if (node.children) node.children = children
  return [node]
}

export function remarkSafeMdx() {
  return (tree: MdxNode) => {
    tree.children = (tree.children ?? []).flatMap(sanitize)
  }
}
