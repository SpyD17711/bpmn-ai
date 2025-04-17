import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Настройки dev-сервера
    host: '0.0.0.0',
    port: process.env.PORT || 5173,
    strictPort: true,
    
    // Прокси для API (чтобы избежать CORS в dev-режиме)
    proxy: {
      '/api': {
        target: 'https://https://bpmn-ai-backend.onrender.com',
        changeOrigin: true, // для обхода CORS
      },
    },
  },
  preview: {
    port: process.env.PORT || 5173,
    allowedHosts: ['bpmn-ai-frontend-sqdx.onrender.com'], // ← ваш фронтенд-URL
  },
});
