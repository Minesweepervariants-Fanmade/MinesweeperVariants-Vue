import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import svgLoader from 'vite-svg-loader'
import UnpluginTypia from '@ryoppippi/unplugin-typia/vite'
import version from 'vite-plugin-package-version';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), version(), svgLoader(), UnpluginTypia()],
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    assetsInlineLimit: 102400,
  },
})
