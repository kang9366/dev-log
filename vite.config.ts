import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // MDX는 React 플러그인보다 먼저 실행되어야 함
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeHighlight],
        providerImportSource: '@mdx-js/react',
      }),
    },
    react(),
  ],
  resolve: {
    alias: {
      '@app':     resolve(__dirname, 'src/app'),
      '@core':    resolve(__dirname, 'src/core'),
      '@feature': resolve(__dirname, 'src/feature'),
      '@ds':      resolve(__dirname, 'src/design-system'),
    },
  },
  define: {
    'process.env': {},
  },
})
