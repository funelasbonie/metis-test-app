import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-ignore - types resolve at runtime
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    port: 5174,
    strictPort: true,
    hmr: {
      protocol: 'wss',
    },
  },
})
