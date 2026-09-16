'use client'
import { useMemo } from 'react'
import * as runtime from 'react/jsx-runtime'
import { MDXProvider, useMDXComponents } from '@mdx-js/react'
import type { MDXComponents } from 'mdx/types'
import { mdxComponents } from './MdxComponents'

type MdxModule = { default: React.ComponentType }

/** compileMdx 결과 실행 (= @mdx-js/mdx runSync). 컴파일러를 브라우저 번들에 넣지 않으려고 직접 실행 */
export function runMdx(code: string): React.ComponentType {
  return (new Function(code)({ ...runtime, useMDXComponents }) as MdxModule).default
}

/**
 * 컴파일된 MDX 본문 렌더링.
 * 클라이언트 컴포넌트지만 서버 렌더링 HTML 에도 본문이 들어감 (검색 노출).
 * 코드는 remarkSafeMdx 로 JS 가 제거된 상태
 */
export function MdxContent({ code, components = mdxComponents }: { code: string; components?: MDXComponents }) {
  const Content = useMemo(() => runMdx(code), [code])
  return (
    <MDXProvider components={components}>
      {/* eslint-disable-next-line react-hooks/static-components -- code 가 바뀔 때만 새로 만듦 */}
      <Content />
    </MDXProvider>
  )
}
