import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: process.env.PORT || 5173, // Использует $PORT от Render
    strictPort: true, // Закрывает сервер, если порт занят
  },
  preview: {
    port: process.env.PORT || 5173,
  }
})