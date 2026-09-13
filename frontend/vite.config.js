import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lunar-javascript',
      'framer-motion',
      'lucide-react',
      'recharts',
      'react-markdown',
      'remark-gfm',
      'axios'
    ]
  },
  build: {
    chunkSizeWarningLimit: 950,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-is')) {
              return 'vendor-react';
            }
            if (id.includes('lunar-javascript')) {
              return 'vendor-lunar';
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('react-markdown') || id.includes('remark-gfm') || id.includes('rehype-sanitize') || id.includes('micromark') || id.includes('unified') || id.includes('unist') || id.includes('vfile') || id.includes('mdast')) {
              return 'vendor-markdown';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            return 'vendor-others';
          }
        }
      }
    }
  }
})
