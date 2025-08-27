import { defineCollection, z } from 'astro:content'

// 汎用ページ用のコレクション
const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.date().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().default(false)
  })
})

export const collections = {
  articles
}
