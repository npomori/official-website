import type { AstroIntegration } from 'astro'
import fs from 'fs/promises'
import path from 'path'

export default function holidayIntegration(): AstroIntegration {
  return {
    name: 'holiday-integration',
    hooks: {
      'astro:build:start': async () => {
        try {
          // APIから祝日データを取得
          const response = await fetch('https://holidays-jp.github.io/api/v1/date.json')
          if (!response.ok) {
            throw new Error('Failed to fetch holiday data')
          }
          const data = await response.json()

          // data/holiday.jsonファイルを更新
          const filePath = path.join(process.cwd(), 'src/data/holiday.json')
          await fs.writeFile(filePath, JSON.stringify(data, null, 2))

          console.log('Holiday data has been updated successfully.')
        } catch (error) {
          console.error('Error updating holiday data:', error)
        }
      }
    }
  }
}
