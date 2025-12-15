import config from '@/config/config.json'
import { validateNewsApi } from '@/schemas/news'
import NewsDB from '@/server/db/news'
import FileUploader from '@/server/utils/file-upload'
import { getConfig, getNewsUploadConfig } from '@/types/config'
import type { CreateNewsData, NewsCreateResponse, NewsListResponse } from '@/types/news'
import type { APIRoute } from 'astro'
import { join } from 'path'
import { z } from 'zod'

const cfg = getNewsUploadConfig()
const UPLOAD_DIR = join(process.cwd(), cfg.directory)

// 管理者用のお知らせ一覧取得
export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category') || undefined
    const priority = searchParams.get('priority') || undefined
    const hidden = searchParams.get('hidden') === 'true' // フロントエンドで表示されない項目のフラグ

    // 設定からデフォルト値を取得
    const config = getConfig()
    const defaultLimit = config.pagination?.newsList?.itemsPerPage || 10
    const itemsPerPage = limit > 0 ? limit : defaultLimit

    let result

    if (hidden) {
      // フロントエンドで表示されない項目（非公開・未来の日付）を取得
      result = await NewsDB.getHiddenNewsWithPagination(page, itemsPerPage)
    } else {
      // 管理権限ありでフロントエンド用のお知らせを取得（ページネーション対応）
      result = await NewsDB.getNewsWithPagination(
        page,
        itemsPerPage,
        true, // 管理権限あり
        true, // 管理者は常にログイン済み
        category,
        priority
      )
    }

    const { news, totalCount } = result

    // ページネーション情報を計算
    const totalPages = Math.ceil(totalCount / itemsPerPage)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          news,
          pagination: {
            currentPage: page,
            itemsPerPage,
            totalCount,
            totalPages
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
        message: 'お知らせデータの取得に失敗しました'
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
    const isMemberOnly = formData.get('isMemberOnly') === 'true'
    const author = formData.get('author') as string

    const newsFileUploader = new FileUploader(UPLOAD_DIR)

    // zodスキーマでバリデーション
    try {
      validateNewsApi({
        title,
        content,
        date,
        categories,
        priority,
        isMemberOnly,
        author
      })
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessages = validationError.issues
          .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
          .join(', ')

        return new Response(
          JSON.stringify({
            success: false,
            message: 'バリデーションエラー',
            errors: { validation: errorMessages }
          }),
          {
            status: 422,
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
      name: string
      filename: string
      size: number
    }> = []
    const files = formData.getAll('files') as File[]

    if (files && files.length > 0) {
      // ファイル数のバリデーション
      if (!newsFileUploader.validateFileCount(files, newsConfig.maxFiles)) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `ファイル数が多すぎます (最大${newsConfig.maxFiles}個)`
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
              message: `ファイルタイプが許可されていません: ${file.name}`
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
              message: `ファイルサイズが大きすぎます: ${file.name} (最大${maxSizeMB}MB)`
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
        const uploadedFiles = await newsFileUploader.uploadFiles(files)
        uploadedAttachments = uploadedFiles.map((f) => ({
          name: f.name,
          filename: f.filename,
          size: f.size
        }))
      } catch (uploadError) {
        console.error('File upload error:', uploadError)
        return new Response(
          JSON.stringify({
            success: false,
            message: 'ファイルのアップロードに失敗しました'
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
      date: new Date(date + 'T00:00:00+09:00'), // 日本時間に変換
      categories,
      attachments: uploadedAttachments,
      isMemberOnly,
      author: author, // フォームから取得した作成者名を使用
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
