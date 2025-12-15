import LocationDB from '@/server/db/location'
import type { APIRoute } from 'astro'

// 公開用の活動地一覧取得
export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const type = searchParams.get('type') // 'regular' | 'activity'
    const hasDetail = searchParams.get('hasDetail')

    let locations

    if (type) {
      locations = await LocationDB.findByType(type)
    } else if (hasDetail === 'true') {
      locations = await LocationDB.findWithDetails()
    } else {
      locations = await LocationDB.findAll()
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { locations }
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
