import type { APIRoute } from 'astro'
import INITIAL_HOLIDAY from '../../data/holiday.json'

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url)
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')

    // 日付範囲のバリデーション（オプション）
    if (start && end) {
      const startDate = new Date(start)
      const endDate = new Date(end)

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return new Response(
          JSON.stringify({
            success: false,
            message: '日付の形式が不正です'
          }),
          {
            status: 400,
            statusText: 'Bad Request',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: INITIAL_HOLIDAY
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '予期せぬエラーが発生しました'
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage
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
