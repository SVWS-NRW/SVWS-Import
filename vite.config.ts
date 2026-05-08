import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

function removeModuleType(): Plugin {
  return {
    name: 'remove-module-type',
    apply: 'build',
    transformIndexHtml(html) {
      return html
        .replace(/<script type="module"/g, '<script defer')
        .replace(/ crossorigin/g, '')
    },
  }
}

export default defineConfig({
  plugins: [vue(), removeModuleType()],
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        format: 'iife',
      },
    },
  },
})
