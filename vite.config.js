import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.VITE_DEV_BACKEND || 'http://localhost:4800';
  // Yo‘l ostida joylash (masalan https://tyutorkpi.sies.uz/samvision/admin): VITE_BASE_PATH=/samvision/
  // Windows ilovasi uchun yig‘ishda bo‘sh qoladi ("/").
  const base = `/${(env.VITE_BASE_PATH || '/').replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');

  return {
    base,
    plugins: [react(), tailwindcss()],
    server: {
      port: 5181,
      strictPort: true, // band bo‘lsa boshqa loyihaning portiga o‘tib ketmasin — aniq xato beradi
      host: true,
      proxy: {
        '/api': { target: backend, changeOrigin: true },
      },
    },
    preview: {
      port: 4181,
      proxy: {
        '/api': { target: backend, changeOrigin: true },
      },
    },
    build: {
      // Ro‘yxatdan o‘tish sayti bilan bitta yo‘l ostida turganda fayllar to‘qnashmasligi uchun
      assetsDir: 'admin-assets',
      sourcemap: false,
      chunkSizeWarningLimit: 900,
    },
  };
});
