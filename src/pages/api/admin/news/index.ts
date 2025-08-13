import config from '@/config/config.json'
import { validateNewsApi } from '@/schemas/news'
import NewsDB from '@/server/db/news'
import { newsFileUploader } from '@/server/utils/file-upload'
import type { CreateNewsData } from '@/types/news'
import type { APIRoute } from 'astro'
import { z } from 'zod'

// 管理者用のお知らせ一覧取得
export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // お知らせ一覧を取得
    const { news, totalCount } = await NewsDB.getNewsForAdminWithPagination(page, limit)

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
    const priority = (formData.get('priority') as string) || null

    // zodスキーマでバリデーション
    try {
      validateNewsApi({
        title,
        content,
        date,
        categories,
        priority
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

    // お知らせのファイルアップロード設定を取得
    const newsConfig = config.upload.news

    // ファイルアップロード処理
    let uploadedAttachments: Array<{
      originalName: string
      filename: string
    }> = []
    const files = formData.getAll('files') as File[]

    if (files && files.length > 0) {
      // ファイル数のバリデーション
      if (!newsFileUploader.validateFileCount(files, newsConfig.maxFiles)) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `ファイル数が多すぎます (最大${newsConfig.maxFiles}個)`
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }

      // ファイルのバリデーション
      for (const file of files) {
        if (!newsFileUploader.validateFileType(file, newsConfig.allowedTypes)) {
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

        if (!newsFileUploader.validateFileSize(file, newsConfig.maxFileSize)) {
          const maxSizeMB = Math.round(newsConfig.maxFileSize / (1024 * 1024))
          return new Response(
            JSON.stringify({
              success: false,
              error: `ファイルサイズが大きすぎます: ${file.name} (最大${maxSizeMB}MB)`
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

    // お知らせを作成
    const newsData: CreateNewsData = {
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

    const news = await NewsDB.createNews(newsData)

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
