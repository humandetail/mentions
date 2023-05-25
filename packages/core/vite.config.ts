import { defineConfig } from 'vitest/config'
import dts from 'vite-plugin-dts'
import postcss from 'rollup-plugin-postcss'

export default defineConfig({
  plugins: [
    dts({
      copyDtsFiles: true
    }),
    postcss({
      extract: true,
      minimize: true,
      modules: false
    })
  ],
  build: {
    lib: {
      entry: './src/index.ts',
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
