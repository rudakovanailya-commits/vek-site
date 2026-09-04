import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const isGitHubPages = process.env.DEPLOY_TARGET === 'gh-pages'

export default defineConfig({
  plugins: [react()],
  base: isGitHubPages ? '/vek-site/' : '/',
})
