import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // Pre-bundle the heavy deps Vite would otherwise discover on first request.
  // Cuts the dev-server "compiling…" pause when you hit a new route.
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react',
      'react-hot-toast',
      'date-fns',
    ],
  },
  build: {
    target: 'es2020',
    // Avoid loading every vendor in the initial chunk.
    rollupOptions: {
      output: {
        manualChunks: {
          // React itself — almost never changes between builds, perfect cache hit.
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Supabase is heavy; keep it isolated so the rest of the app loads fast.
          'supabase':     ['@supabase/supabase-js'],
          // Icons + tiny UI libs grouped together.
          'ui':           ['lucide-react', 'react-hot-toast', 'date-fns'],
        },
      },
    },
    // Slight bump — large source maps are not worth shipping to prod.
    sourcemap: false,
    chunkSizeWarningLimit: 700,
  },
})
