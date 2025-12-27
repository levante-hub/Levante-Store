import devServer from '@hono/vite-dev-server'
import build from '@hono/vite-build/vercel'
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  plugins: [
    !process.env.VITEST && devServer({
      entry: 'src/index.tsx'
    }),
    build({
      entry: 'src/index.tsx',
      serverless: true
    })
  ],
  test: {
    environment: 'node',
    globals: true,
    exclude: ['**/connection.test.ts', '**/node_modules/**'],
  }
})
