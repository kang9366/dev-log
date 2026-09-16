/// <reference types="vite/client" />

// MDX 파일 타입 선언
declare module '*.mdx' {
  import type { MDXProps } from 'mdx/types'
  import type { ComponentType } from 'react'

  export interface PostMeta {
    title: string
    date: string
    tag: string
    excerpt: string
    imageUrl: string
    slug: string
  }

  export const meta: PostMeta
  const MDXComponent: ComponentType<MDXProps>
  export default MDXComponent
}


interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}
