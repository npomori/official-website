import NewsDB from '@/server/db/news'
import {
  ALLOWED_NEWS_FILE_TYPES,
  MAX_NEWS_FILE_SIZE_MB,
  newsFileUploader
} from '@/server/utils/file-upload'
import type { APIRoute } from 'astro'

// 管理者用のお知らせ一覧取得
export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const priority = searchParams.get('priority')

    // NewsDBインスタンスを作成
    const newsDB = new NewsDB()

    // お知らせ一覧を取得
    const { news, totalCount } = await newsDB.getNewsForAdminWithPagination(page, limit)

    const totalPages = Math.ceil(totalCount / limit)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          news,
          pagination: {
            currentPage: page,
            itemsPerPage: limit,
            totalCount,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
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
    console.error('Admin news fetch error:', error)
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

// 管理者用のお知らせ作成
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData()

    const title = formData.get('title') as string
    const content = formData.get('content') as string
    const date = formData.get('date') as string
    const categories = JSON.parse(formData.get('categories') as string)
    const priority = (formData.get('priority') as string) || undefined

    // バリデーション
    if (!title || !content || !date || !categories || categories.length === 0) {
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

    // ファイルアップロード処理
    let uploadedAttachments: any[] = []
    const files = formData.getAll('files') as File[]

    if (files && files.length > 0) {
      // ファイルのバリデーション
      for (const file of files) {
        if (!newsFileUploader.validateFileType(file, ALLOWED_NEWS_FILE_TYPES)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `ファイルタイプが許可されていません: ${file.name}`
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          )
        }

        if (!newsFileUploader.validateFileSize(file, MAX_NEWS_FILE_SIZE_MB)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `ファイルサイズが大きすぎます: ${file.name} (最大${MAX_NEWS_FILE_SIZE_MB}MB)`
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

      // ファイルをアップロード
      try {
        uploadedAttachments = await newsFileUploader.uploadFiles(files)
      } catch (uploadError) {
        console.error('File upload error:', uploadError)
        return new Response(
          JSON.stringify({
            success: false,
            error: 'ファイルのアップロードに失敗しました'
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

    // NewsDBインスタンスを作成
    const newsDB = new NewsDB()

    // お知らせを作成
    const newsData: any = {
      title,
      content,
      date: new Date(date),
      categories,
      attachments: uploadedAttachments,
      author: '管理者', // 管理者として作成
      status: 'published',
      creatorId: locals.user?.id || 1 // 認証されたユーザーIDまたはデフォルト値
    }

    if (priority) {
      newsData.priority = priority
    }

    const news = await newsDB.createNews(newsData)

    return new Response(
      JSON.stringify({
        success: true,
        data: news,
        message: 'お知らせを作成しました'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Admin news creation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'お知らせの作成に失敗しました'
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
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
