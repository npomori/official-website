import { NewsDB } from '@/server/db'
import { getConfig } from '@/types/config'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category') || undefined
    const priority = searchParams.get('priority') || undefined

    // 設定からデフォルト値を取得
    const config = getConfig()
    const defaultLimit = config.pagination?.newsList?.itemsPerPage || 10
    const itemsPerPage = limit > 0 ? limit : defaultLimit

    // NewsDBを使用してフロントエンド用のお知らせを取得（ページネーション対応）
    const newsDB = new NewsDB()
    const { news, totalCount } = await newsDB.getNewsForFrontendWithPagination(
      page,
      itemsPerPage,
      category,
      priority
    )

    // ページネーション情報を計算
    const totalPages = Math.ceil(totalCount / itemsPerPage)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          news,
          pagination: {
            currentPage: page,
            itemsPerPage,
            totalCount,
            totalPages,
            hasNextPage,
            hasPrevPage
          }
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('News API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'お知らせデータの取得に失敗しました'
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

    // 権限チェック
    if (!['ADMIN', 'MODERATOR', 'EDITOR'].includes(user.role)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'お知らせ作成の権限がありません'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // FormDataを取得
    const formData = await request.formData()

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const date = formData.get('date') as string
    const categories = formData.get('categories') as string
    const priority = formData.get('priority') as string
    const attachments = formData.get('attachments') as string
    const files = formData.getAll('files') as File[]

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

    // カテゴリーをパース
    let parsedCategories: string[]
    try {
      parsedCategories = JSON.parse(categories)
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'カテゴリーの形式が正しくありません'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 添付ファイル名をパース
    let parsedAttachments: string[] = []
    if (attachments) {
      try {
        parsedAttachments = JSON.parse(attachments)
      } catch {
        return new Response(
          JSON.stringify({
            success: false,
            error: '添付ファイルの形式が正しくありません'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
    }

    // ファイルアップロード処理（簡易版）
    const uploadedFiles: string[] = []
    for (const file of files) {
      // 実際の実装では、ファイルをサーバーに保存する処理が必要
      // ここでは簡易的にファイル名のみを保存
      uploadedFiles.push(file.name)
    }

    // お知らせデータを作成
    const newsData = {
      title,
      content,
      date: new Date(date),
      categories: parsedCategories,
      priority: priority || null,
      attachments: [...parsedAttachments, ...uploadedFiles],
      author: user.name,
      status: 'published',
      creatorId: user.id
    }

    // NewsDBを使用してお知らせを保存
    const newsDB = new NewsDB()
    const createdNews = await newsDB.createNews(newsData)

    return new Response(
      JSON.stringify({
        success: true,
        data: createdNews
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('News creation API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'お知らせの作成に失敗しました'
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
