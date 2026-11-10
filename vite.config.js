import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backend = env.VITE_DEV_BACKEND || 'http://localhost:4800';

  return {
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
      sourcemap: false,
      chunkSizeWarningLimit: 900,
    },
  };
});
