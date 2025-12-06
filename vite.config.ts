import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // При кастомном домене используем корень
  base: '/',
  plugins: [react()],
  server: {
    port: 3050,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Оптимизация для продакшена
    minify: 'esbuild', // Используем esbuild (быстрее и встроен в Vite)
    sourcemap: false, // Отключаем source maps для продакшена (можно включить для отладки)
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'animation-vendor': ['framer-motion'],
          'swiper-vendor': ['swiper'],
          'date-vendor': ['date-fns'],
        },
        // Оптимизация имен файлов
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Увеличиваем лимит предупреждений для больших чанков
    chunkSizeWarningLimit: 1000,
    // Оптимизация размера
    target: 'es2015',
    cssCodeSplit: true,
  },
})
