import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages 项目站点路径为 /DuoLink/，需设置 base 让资源引用路径正确
  base: '/DuoLink/',
})
