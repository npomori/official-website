import { ArticleDB } from '@/server/db'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const id = parseInt(params.id!)

    if (isNaN(id)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '無効な記事IDです'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // ユーザーのログイン状態を取得
    const user = locals.user
    const isLoggedIn = !!user

    // 記事詳細を取得
    const article = await ArticleDB.getArticleById(id, isLoggedIn)

    if (!article) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '記事が見つかりません'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          article
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
    console.error('Article Detail API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '記事データの取得に失敗しました'
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
