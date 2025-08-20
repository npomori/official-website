import { CommentDB } from '@/server/db'
import type { APIRoute } from 'astro'

// Event API
export const GET: APIRoute = async ({ url }) => {
  try {
    const eventId = url.searchParams.get('eventId')

    if (!eventId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'イベントIDは必須です'
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

    const comments = await CommentDB.getCommentsByEventId(Number(eventId))

    return new Response(
      JSON.stringify({
        success: true,
        data: comments
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'コメントの取得に失敗しました'
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json()
    const { content, eventId } = body

    if (!content || !eventId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'コメントの内容とイベントIDは必須です'
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

    const comment = await CommentDB.addComment(locals.user.id, {
      content,
      eventId: Number(eventId),
      creatorId: locals.user.id
    })

    if (!comment) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'コメントの登録に失敗しました'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: comment
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
