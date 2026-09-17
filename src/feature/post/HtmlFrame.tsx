'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useThemeMode } from '@shell/ThemeContext'
import { injectIntoHtml } from './injectIntoHtml'

/**
 * 글의 HTML 버전을 격리된 프레임으로 보여줌.
 * sandbox 에 allow-same-origin 이 없어 프레임 안 스크립트는 사이트 쿠키·DOM 에 접근 불가.
 * 높이는 프레임 안에서 postMessage 로 알려줘 스크롤 없이 페이지에 녹아들게 함.
 */
export function HtmlFrame({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(600)
  const { mode = 'light' } = useThemeMode()

  const srcDoc = useMemo(() => injectIntoHtml(
    html,
    // 사이트 라이트/다크를 따르게 data-theme 지정, 링크는 새 탭
    `<base target="_blank"><script>document.documentElement.dataset.theme=${JSON.stringify(mode)};document.documentElement.style.colorScheme=${JSON.stringify(mode)}</script>`,
    // ponytail: 100vh 로 높이를 잡는 문서는 프레임이 커질수록 같이 커짐. 문제 되면 최대 높이 제한
    `<script>new ResizeObserver(function(){parent.postMessage({devlogHtmlHeight:document.documentElement.scrollHeight},'*')}).observe(document.documentElement)</script>`,
  ), [html, mode])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return
      const h = e.data?.devlogHtmlHeight
      if (typeof h === 'number') setHeight((prev) => (Math.abs(prev - h) > 1 ? Math.ceil(h) : prev))
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <iframe
      ref={ref}
      title={`${title} (HTML)`}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      className="block w-full rounded-xl border bg-card"
      style={{ height }}
    />
  )
}
