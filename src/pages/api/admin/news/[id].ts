import { validateNewsApi } from '@/schemas/news'
import NewsDB from '@/server/db/news'
import FileUploader from '@/server/utils/file-upload'
import { getNewsUploadConfig } from '@/types/config'
import type { UpdateNewsData } from '@/types/news'
import type { APIRoute } from 'astro'
import { join } from 'path'
import { z } from 'zod'

const cfg = getNewsUploadConfig()
const UPLOAD_DIR = join(process.cwd(), cfg.directory)

// 管理者用の個別お知らせ取得
export const GET: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id)

    if (isNaN(id)) {
      return new Response(JSON.stringify({ success: false, message: '無効なIDです' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    const news = await NewsDB.getNewsById(id)

    if (!news) {
      return new Response(JSON.stringify({ success: false, message: 'お知らせが見つかりません' }), {
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
    return new Response(JSON.stringify({ success: false, message: errorMessage }), {
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
      return new Response(JSON.stringify({ success: false, message: '無効なIDです' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }
    // Content-Typeを確認（multipart/form-data のみ受け付け）
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ success: false, message: 'multipart/form-data で送信してください' }),
        { status: 415, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // FormDataから値を取得
    const formData = await request.formData()
    const title = String(formData.get('title') || '')
    const content = String(formData.get('content') || '')
    const date = String(formData.get('date') || '')
    let categories: string[]
    try {
      categories = JSON.parse(String(formData.get('categories') || '[]'))
    } catch {
      categories = []
    }
    const priority = (formData.get('priority') as string) || null
    const isMemberOnly = String(formData.get('isMemberOnly') || 'false') === 'true'
    const isDraft = String(formData.get('isDraft') || 'false') === 'true'
    const author = String(formData.get('author') || '')
    const newFiles = (formData.getAll('files') as File[]) || []
    let removedFiles: string[]
    try {
      removedFiles = JSON.parse(String(formData.get('removedFiles') || '[]'))
    } catch {
      removedFiles = []
    }

    // zodスキーマでバリデーション
    try {
      validateNewsApi({
        title,
        content,
        date,
        categories,
        priority: priority || null,
        isMemberOnly: isMemberOnly || false,
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

    // お知らせが存在するか確認
    const existingNews = await NewsDB.getNewsById(id)

    if (!existingNews) {
      return new Response(JSON.stringify({ success: false, message: 'お知らせが見つかりません' }), {
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
      date: new Date((date as string) + 'T00:00:00+09:00'), // 日本時間に変換
      categories,
      isMemberOnly,
      author,
      status: isDraft ? 'draft' : 'published'
    }

    if (priority) {
      updateData.priority = priority
    }

    // 添付ファイルの処理（既存 - 削除 + 新規アップロード）
    const newsFileUploader = new FileUploader(UPLOAD_DIR)
    const newsConfig = (await import('@/config/config.json')).default.upload.news

    // バリデーション（ファイル数/型/サイズ）
    if (newFiles.length > 0) {
      for (const file of newFiles) {
        if (!newsFileUploader.validateFileType(file, newsConfig.allowedTypes)) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `ファイルタイプが許可されていません: ${file.name}`
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }
        if (!newsFileUploader.validateFileSize(file, newsConfig.maxFileSize)) {
          const maxSizeMB = Math.round(newsConfig.maxFileSize / (1024 * 1024))
          return new Response(
            JSON.stringify({
              success: false,
              message: `ファイルサイズが大きすぎます: ${file.name} (最大${maxSizeMB}MB)`
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // 既存添付から削除対象を除外
    const currentAttachments = (existingNews.attachments || []).filter((att) =>
      removedFiles.length > 0 ? !removedFiles.includes(att.filename) : true
    )

    // 合計ファイル数の検証（既存-削除+新規 <= maxFiles）
    const totalAfterUpdate = currentAttachments.length + newFiles.length
    if (totalAfterUpdate > newsConfig.maxFiles) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `ファイル数が多すぎます (最大${newsConfig.maxFiles}個)`
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 新規ファイルをアップロード
    let uploadedAttachments: { name: string; filename: string; size: number }[] = []
    if (newFiles.length > 0) {
      const uploadedFiles = await newsFileUploader.uploadFiles(newFiles)
      uploadedAttachments = uploadedFiles.map((f) => ({
        name: f.name,
        filename: f.filename,
        size: f.size
      }))
    }

    // 合成
    updateData.attachments = [...currentAttachments, ...uploadedAttachments]

    // 物理削除
    if (removedFiles.length > 0) {
      await newsFileUploader.deleteFiles(removedFiles)
    }

    const updatedNews = await NewsDB.updateNews(id, updateData)

    if (!updatedNews) {
      return new Response(
        JSON.stringify({ success: false, message: 'お知らせの更新に失敗しました' }),
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
    return new Response(JSON.stringify({ success: false, message: errorMessage }), {
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
      return new Response(JSON.stringify({ success: false, message: '無効なIDです' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // お知らせが存在するか確認
    const existingNews = await NewsDB.getNewsById(id)

    if (!existingNews) {
      return new Response(JSON.stringify({ success: false, message: 'お知らせが見つかりません' }), {
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
        JSON.stringify({ success: false, message: 'お知らせの削除に失敗しました' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 添付ファイルがあれば削除
    if (existingNews?.attachments && Array.isArray(existingNews.attachments)) {
      const newsFileUploader = new FileUploader(UPLOAD_DIR)
      const filenames: string[] = []
      for (const att of existingNews.attachments) {
        if (
          att &&
          typeof att === 'object' &&
          'filename' in att &&
          typeof att.filename === 'string'
        ) {
          filenames.push(att.filename)
        }
      }
      await newsFileUploader.deleteFiles(filenames)
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
    return new Response(JSON.stringify({ success: false, message: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}
