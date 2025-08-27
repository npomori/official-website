import mdx from '@astrojs/mdx'
import node from '@astrojs/node'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'
import holidayIntegration from './src/integrations/holiday'

export default defineConfig({
  integrations: [
    react(),
    mdx(),
    icon({
      include: {
        mdi: ['*']
      }
    }),
    // 祝日データファイルを生成(ビルド時のみ)
    holidayIntegration()
  ],
  output: 'server',
  adapter: node({
    mode: 'standalone'
  }),
  server: { port: 3000, host: true },
  vite: {
    plugins: [tailwindcss()],
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    },
    optimizeDeps: {
      exclude: ['@fullcalendar/core', '@fullcalendar/daygrid', '@fullcalendar/react']
    }
  }
})
