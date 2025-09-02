import { ArticleDB } from '@/server/db'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  try {
    const articleDB = new ArticleDB()
    const tags = await articleDB.getTags()

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          tags
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Article Tags API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'タグ一覧の取得に失敗しました'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}
