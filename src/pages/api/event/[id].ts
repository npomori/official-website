import colors from '@/config/event-category.json'
import { EventDB } from '@/server/db'
import { formatDate } from '@/server/utils/date'
import type { EventDetailResponse } from '@/types/event'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id)
    if (isNaN(id)) {
      return new Response(JSON.stringify({ message: '有効なIDが指定されていません' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    const event = await EventDB.getEventById(id)

    if (!event) {
      return new Response(JSON.stringify({ message: 'イベントが見つかりませんでした' }), {
        status: 404,
        statusText: 'Not Found',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    const categoryIndex = colors.findIndex((color) => color.value === event.categoryId)
    const categoryColor = colors[categoryIndex]

    const mappedEvent: EventDetailResponse = {
      id: event.id,
      title: event.title,
      allDay: event.isAllDay,
      start: formatDate(event.start, event.isAllDay),
      end: formatDate(event.end, event.isAllDay),
      description: event.description ?? '',
      url: event.url ?? '',
      color: categoryColor?.color ?? 'black',
      categoryIndex: categoryIndex >= 0 ? categoryIndex : 0
    }

    return new Response(JSON.stringify(mappedEvent), {
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
