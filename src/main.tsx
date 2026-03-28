import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from '@feature/home/Home'
import PostViewer from '@feature/post/PostViewer'
import { RootLayout } from '@app/shell/RootLayout'
import { AppThemeProvider } from '@app/providers/ThemeContext'
import MdxEditor from "@feature/editor/MdxEditor.tsx";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* 에디터 — 풀스크린 (RootLayout 없음) */}
          <Route path="/editor" element={<MdxEditor />} />
          <Route path="/editor/:slug" element={<MdxEditor />} />

          {/* 나머지 — Banner + padding 레이아웃 */}
          <Route path="/*" element={
            <RootLayout>
              <Routes>
                <Route path="/"            element={<Home />} />
                <Route path="/posts/:slug" element={<PostViewer />} />
              </Routes>
            </RootLayout>
          } />
        </Routes>
      </BrowserRouter>
    </AppThemeProvider>
  </StrictMode>
)