import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './index.ts',
      name: 'mentions',
      fileName: 'mentions'
    },
    sourcemap: true
  }
})
