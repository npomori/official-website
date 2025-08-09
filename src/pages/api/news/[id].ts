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

    // NewsDBを使用してお知らせを取得
    const newsDB = new NewsDB()
    const news = await newsDB.getNewsById(newsId)

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

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // ユーザー認証チェック
    const user = (locals as any).user
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '認証が必要です'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

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

    // 権限チェック
    if (!['ADMIN', 'MODERATOR', 'EDITOR'].includes(user.role)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'お知らせ編集の権限がありません'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 既存のお知らせを取得
    const newsDB = new NewsDB()
    const existingNews = await newsDB.getNewsById(newsId)

    if (!existingNews) {
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

    // EDITORの場合、自分のお知らせのみ編集可能
    if (user.role === 'EDITOR' && existingNews.creatorId !== user.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'このお知らせを編集する権限がありません'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // リクエストボディを取得
    const body = await request.json()

    const { title, content, date, categories, priority, attachments } = body

    // バリデーション
    if (!title || !content || !date || !categories) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '必須項目が不足しています'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // お知らせデータを更新
    const updateData = {
      title,
      content,
      date: new Date(date),
      categories,
      priority: priority || null,
      attachments: attachments || [],
      status: 'published'
    }

    const updatedNews = await newsDB.updateNews(newsId, updateData)

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedNews
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('News PUT API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'お知らせの更新に失敗しました'
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

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // ユーザー認証チェック
    const user = (locals as any).user
    if (!user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: '認証が必要です'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

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

    // 権限チェック
    if (!['ADMIN', 'MODERATOR', 'EDITOR'].includes(user.role)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'お知らせ削除の権限がありません'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 既存のお知らせを取得
    const newsDB = new NewsDB()
    const existingNews = await newsDB.getNewsById(newsId)

    if (!existingNews) {
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

    // EDITORの場合、自分のお知らせのみ削除可能
    if (user.role === 'EDITOR' && existingNews.creatorId !== user.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'このお知らせを削除する権限がありません'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // お知らせを削除
    await newsDB.deleteNews(newsId)

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
    console.error('News DELETE API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'お知らせの削除に失敗しました'
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
