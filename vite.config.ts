import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Raise warning threshold so legitimate large chunks are flagged correctly
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — changes rarely, long cache life
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Radix UI primitives — large but stable
          'vendor-radix': [
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          // Supabase client — updates independently of UI
          'vendor-supabase': ['@supabase/supabase-js'],
          // Small UI utilities bundled together
          'vendor-ui': [
            'lucide-react',
            'sonner',
            'clsx',
            'tailwind-merge',
            'class-variance-authority',
          ],
        },
      },
    },
  },
})
