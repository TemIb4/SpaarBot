import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const timestamp = Date.now()

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: '/app/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        // CRITICAL: Add timestamp to EVERY file
        entryFileNames: `assets/[name].[hash].${timestamp}.js`,
        chunkFileNames: `assets/[name].[hash].${timestamp}.js`,
        assetFileNames: `assets/[name].[hash].${timestamp}.[ext]`,
      },
    },
  },
})