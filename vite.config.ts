import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // Stable localhost certificate (generated once, trusted once in Windows).
  // basicSssl() minted a NEW self-signed cert on every restart, so the browser
  // re-warned "connection not secure" each time and service-worker / popup
  // fetches failed outright. A stable cert fixes the whole session. Falls back
  // to plain http only if the cert files are missing (fresh clone).
  const certDir = path.resolve(__dirname, '.cert');
  const useHttps =
    fs.existsSync(path.join(certDir, 'localhost.pem')) &&
    fs.existsSync(path.join(certDir, 'localhost-key.pem'));

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: true,
      port: 5174,
      hmr: true,
      ...(useHttps
        ? {
            https: {
              key: fs.readFileSync(path.join(certDir, 'localhost-key.pem')),
              cert: fs.readFileSync(path.join(certDir, 'localhost.pem')),
            },
          }
        : {}),
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          secure: false,
        },
        '/ws': {
          target: 'ws://127.0.0.1:3000',
          ws: true,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/ws/, ''),
        },
      },
    },
  };
});