import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5515,
    proxy: {
      '/api': {
        target: 'http://localhost:4115',
        changeOrigin: true
      }
    }
  }
})
