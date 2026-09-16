import { compile } from '@mdx-js/mdx'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { remarkSafeMdx } from './remarkSafeMdx'

/**
 * MDX 본문 → 실행 가능한 function-body 코드 문자열.
 * 글 페이지(서버)와 에디터 미리보기(브라우저)가 같은 규칙으로 컴파일.
 * 실행은 @feature/post/MdxContent 가 담당
 */
export async function compileMdx(source: string): Promise<string> {
  const file = await compile(source, {
    outputFormat: 'function-body',
    remarkPlugins: [remarkGfm, remarkSafeMdx],
    rehypePlugins: [rehypeHighlight],
    providerImportSource: '@mdx-js/react',
    development: false,
  })
  return String(file)
}
