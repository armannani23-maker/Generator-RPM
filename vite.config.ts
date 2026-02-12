import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  define: {
    // Injeksi eksplisit variabel API_KEY agar tersedia di lingkungan browser
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
    // Mencegah error 'process is not defined' jika ada library yang mengecek process.env
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    }
  }
});