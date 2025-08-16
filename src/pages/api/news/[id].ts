import { NewsDB } from '@/server/db'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const newsId = parseInt(params.id!)

    if (isNaN(newsId)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '無効なお知らせIDです'
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

    // NewsDBを使用してお知らせを取得
    const news = await NewsDB.getPublicNewsById(newsId, isLoggedIn)

    if (!news) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'お知らせが見つかりません'
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
        data: news
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('News GET API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'お知らせの取得に失敗しました'
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
