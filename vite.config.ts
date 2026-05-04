import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
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
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-primevue': ['primevue', '@primevue/themes'],
          'vendor-aggrid': [
            '@ag-grid-community/core',
            '@ag-grid-community/client-side-row-model',
            '@ag-grid-community/vue3',
          ],
          'vendor-parse': ['papaparse', 'read-excel-file/browser', 'axios'],
        },
      },
    },
  },
})
