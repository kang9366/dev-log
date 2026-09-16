import type { Metadata } from 'next'
import EditorPage from '@feature/editor/EditorPage'

export const metadata: Metadata = { title: '에디터', robots: { index: false } }

export default function Page() {
  return <EditorPage />
}
