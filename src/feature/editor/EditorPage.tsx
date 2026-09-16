'use client'
import dynamic from 'next/dynamic'

// CodeMirror 는 브라우저 전용 → 서버 렌더링 제외
const MdxEditor = dynamic(() => import('./MdxEditor'), { ssr: false })

export default function EditorPage() {
  return <MdxEditor />
}
