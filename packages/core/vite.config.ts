import { defineConfig } from 'vitest/config'

export default defineConfig({
  build: {
    lib: {
      entry: './index.ts',
      name: 'mentions',
      fileName: 'mentions'
    },
    sourcemap: true
  },
  test: {
    environment: 'happy-dom',
    coverage: {
      provider: 'c8'
    }
  }
})
