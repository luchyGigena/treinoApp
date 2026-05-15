import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/routines': 'http://localhost:3000',
      '/weight-logs': 'http://localhost:3000',
      '/workout-logs': 'http://localhost:3000',
    },
  },
})
