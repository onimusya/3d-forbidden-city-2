type NodeRuntime = {
  process?: {
    env?: Record<string, string | undefined>
  }
}

const runtimeProcess = (globalThis as NodeRuntime).process
const repositoryName = runtimeProcess?.env?.GITHUB_REPOSITORY?.split('/') [1]
const githubPagesBase = repositoryName ? '/' + repositoryName + '/' : '/'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: githubPagesBase,
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.trycloudflare.com'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          interface: ['gsap', 'lucide-react', 'zustand'],
        },
      },
    },
  },
})
