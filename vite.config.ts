import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwind from '@tailwindcss/vite'

// GitHub Pages đặt app ở /game-quy-dao/ nên base phải khớp, không thì
// service worker và mọi tệp con 404.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/game-quy-dao/' : '/',
  plugins: [react(), tailwind()],
  build: { target: 'es2020' },
})
