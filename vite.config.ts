import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: true, 
      port: 5173,
      hmr: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000', // 🔥 FIX: Changed from localhost to 127.0.0.1
          changeOrigin: true,
          secure: false,
        }
      }
    },
  };
});