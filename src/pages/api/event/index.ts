import colors from '@/config/event-category.json'
import { EventDB } from '@/server/db'
import { formatDate } from '@/server/utils/date'
import { type EventResponse } from '@/types/event'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url)
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')

    // クライアントフォーマット(JST)からDB用フォーマット(UTC)に変換
    // 終日イベントの場合は日付部分のみを使用
    const startDate = new Date(start + 'T00:00:00+09:00')
    const endDate = new Date(end + 'T00:00:00+09:00')

    // 日付形式のチェック
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

    // 日付期間のチェック
    if (startDate >= endDate) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '開始日は終了日より前でなければなりません'
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

    // イベント取得
    const events = await EventDB.getPublicEvents(startDate, endDate)

    // レスポンス用データ作成
    const mappedEvents = events.map((event) => {
      const categoryIndex = colors.findIndex((color) => color.value === event.categoryId)
      const categoryColor = colors[categoryIndex]

      return {
        id: event.id,
        title: event.title,
        allDay: event.isAllDay,
        start: formatDate(event.start, event.isAllDay),
        end: formatDate(event.end, event.isAllDay),
        color: categoryColor?.color || 'black',
        commentCount: event.commentCount,
        categoryIndex: categoryIndex >= 0 ? categoryIndex : 0
      } as EventResponse
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: mappedEvents
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
