import { CommentDB } from '@/server/db'
import type { APIRoute } from 'astro'

// Event API
export const GET: APIRoute = async ({ url }) => {
  try {
    const eventId = url.searchParams.get('eventId')

    if (!eventId) {
      return new Response(JSON.stringify({ message: 'イベントIDは必須です' }), {
        status: 400,
        statusText: 'Bad Request',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    const comments = await CommentDB.getCommentsByEventId(Number(eventId))

    return new Response(JSON.stringify(comments), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'コメントの取得に失敗しました' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
