import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Add this to make the server accessible from the network, which can be useful.
    // host: '0.0.0.0', 
  },
  // This is important for Electron to be able to load files correctly in production.
  base: './',
  build: {
    outDir: 'dist',
  },
})
