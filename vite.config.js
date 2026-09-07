import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // 相对路径 base：构建产物可在任意子路径部署（GitHub Pages 项目页、CDN 子目录等）
  base: './',
  plugins: [react()],
  build: {
    // 显式声明构建产物文件名带 Hash（Vite 默认行为，此处固化防止后续被改动）
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
