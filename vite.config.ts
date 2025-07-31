import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // 内联资源文件的大小限制
    // 设置为较大值以内联小字体文件(如Copperplate 48KB)
    assetsInlineLimit: 102400, // 100KB以下的文件将被内联为base64
    // 对于更大的字体文件(如Source Han Sans 10MB)，仍然保持外部引用
  },
})
