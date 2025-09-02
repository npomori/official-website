import { ArticleDB } from '@/server/db'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  try {
    const articleDB = new ArticleDB()
    const categories = await articleDB.getCategories()

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          categories
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
    console.error('Article Categories API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'カテゴリー一覧の取得に失敗しました'
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
