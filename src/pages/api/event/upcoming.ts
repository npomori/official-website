import { EventDB } from '@/server/db'
import { formatDate } from '@/server/utils/date'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '3')

    // 最新のイベントを取得
    const events = await EventDB.getUpcomingEvents(limit)

    // レスポンス用データ作成
    const mappedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      start: formatDate(event.start, event.isAllDay),
      end: formatDate(event.end, event.isAllDay),
      isAllDay: event.isAllDay,
      categoryId: event.categoryId,
      commentCount: event.commentCount
    }))

    return new Response(JSON.stringify(mappedEvents), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '予期せぬエラーが発生しました'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
