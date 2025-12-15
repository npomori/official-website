import LocationDB from '@/server/db/location'
import type { APIRoute } from 'astro'

// 公開用の活動地詳細取得
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '活動地IDが指定されていません'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const location = await LocationDB.findById(id)

    if (!location) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '活動地が見つかりません'
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
        data: location
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Location API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '活動地データの取得に失敗しました'
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
