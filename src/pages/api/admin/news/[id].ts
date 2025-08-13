import { validateNewsApi } from '@/schemas/news'
import NewsDB from '@/server/db/news'
import type { UpdateNewsData } from '@/types/news'
import type { APIRoute } from 'astro'
import { z } from 'zod'

// 管理者用の個別お知らせ取得
export const GET: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id)

    if (isNaN(id)) {
      return new Response(JSON.stringify({ success: false, error: '無効なIDです' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    const news = await NewsDB.getNewsById(id)

    if (!news) {
      return new Response(JSON.stringify({ success: false, error: 'お知らせが見つかりません' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      })
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
    console.error('Admin news fetch error:', error)
    const errorMessage = error instanceof Error ? error.message : 'お知らせの取得に失敗しました'
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

// 管理者用のお知らせ更新
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = Number(params.id)

    if (isNaN(id)) {
      return new Response(JSON.stringify({ success: false, error: '無効なIDです' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    const body = await request.json()
    const { title, content, date, categories, priority, attachments } = body

    // zodスキーマでバリデーション
    try {
      validateNewsApi({
        title,
        content,
        date,
        categories,
        priority: priority || null
      })
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.issues
          .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
          .join(', ')

        return new Response(
          JSON.stringify({
            success: false,
            error: 'バリデーションエラー',
            details: errorMessages
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
      throw validationError
    }

    // お知らせが存在するか確認
    const existingNews = await NewsDB.getNewsById(id)

    if (!existingNews) {
      return new Response(JSON.stringify({ success: false, error: 'お知らせが見つかりません' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // お知らせを更新
    const updateData: UpdateNewsData = {
      title,
      content,
      date: new Date(date as string),
      categories,
      attachments: attachments || []
    }

    if (priority) {
      updateData.priority = priority
    }

    const updatedNews = await NewsDB.updateNews(id, updateData)

    if (!updatedNews) {
      return new Response(
        JSON.stringify({ success: false, error: 'お知らせの更新に失敗しました' }),
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
        data: updatedNews,
        message: 'お知らせを更新しました'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Admin news update error:', error)
    const errorMessage = error instanceof Error ? error.message : 'お知らせの更新に失敗しました'
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

// 管理者用のお知らせ削除
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id)

    if (isNaN(id)) {
      return new Response(JSON.stringify({ success: false, error: '無効なIDです' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // お知らせが存在するか確認
    const existingNews = await NewsDB.getNewsById(id)

    if (!existingNews) {
      return new Response(JSON.stringify({ success: false, error: 'お知らせが見つかりません' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // お知らせを削除
    const success = await NewsDB.deleteNews(id)

    if (!success) {
      return new Response(
        JSON.stringify({ success: false, error: 'お知らせの削除に失敗しました' }),
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
        message: 'お知らせを削除しました'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Admin news deletion error:', error)
    const errorMessage = error instanceof Error ? error.message : 'お知らせの削除に失敗しました'
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
