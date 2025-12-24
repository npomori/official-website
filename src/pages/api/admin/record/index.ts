import { safeValidateRecordData } from '@/schemas/record'
import { RecordDB } from '@/server/db'
import { processImagesWithResize } from '@/server/utils/image-processor'
import { getConfig, getRecordUploadConfig } from '@/types/config'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // ユーザー認証チェック
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '認証が必要です'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const searchParams = url.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // 設定からデフォルト値を取得
    const config = getConfig()
    const defaultLimit = config.pagination?.recordList?.itemsPerPage || 10
    const itemsPerPage = limit > 0 ? limit : defaultLimit

    // RecordDBを使用して管理画面用の記録を取得（ページネーション対応）
    const { records: paginatedRecords, totalCount } =
      await RecordDB.getRecordsForAdminWithPagination(page, itemsPerPage)

    // ページネーション情報を計算
    const totalPages = Math.ceil(totalCount / itemsPerPage)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          records: paginatedRecords,
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
    console.error('Admin Record API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: '記録データの取得に失敗しました'
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
    // 設定を取得
    const recordConfig = getRecordUploadConfig()

    // ユーザー認証チェック
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '認証が必要です'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const contentType = request.headers.get('content-type') || ''
    let dateForFilename: string
    let data: any
    let uploadedImageNames: string[] = []
    let totalImageCount = 0

    if (contentType.includes('multipart/form-data')) {
      // FormDataの場合（画像付き）
      const formData = await request.formData()
      dateForFilename = formData.get('dateForFilename') as string
      const dataJson = formData.get('data') as string
      data = JSON.parse(dataJson)

      // 下書きフラグを取得
      const isDraft = formData.get('isDraft') === 'true'
      data.isDraft = isDraft

      // 画像ファイルの処理
      const imageFiles = formData.getAll('images') as File[]
      totalImageCount = imageFiles.length

      if (imageFiles.length > 0) {
        // 画像アップロード機能の有効性チェック
        if (!recordConfig.enabled) {
          return new Response(
            JSON.stringify({
              success: false,
              message: '画像アップロード機能は無効になっています'
            }),
            {
              status: 403,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          )
        }

        // ファイル数の制限チェック
        if (imageFiles.length > recordConfig.maxFiles) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `画像ファイルは最大${recordConfig.maxFiles}個までアップロードできます`
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          )
        }

        // 画像をリサイズ処理（部分成功対応）
        const processingResult = await processImagesWithResize(imageFiles, {
          directory: recordConfig.directory,
          maxWidth: recordConfig.maxSize.width,
          maxHeight: recordConfig.maxSize.height,
          quality: recordConfig.quality,
          allowedTypes: recordConfig.allowedTypes,
          maxFileSize: recordConfig.maxFileSize
        })

        uploadedImageNames = processingResult.succeeded.map((f) => f.filename)

        // 失敗した画像がある場合はログに記録
        if (processingResult.failed.length > 0) {
          console.warn('Some images failed to upload:', processingResult.failed)
        }
      }
    } else {
      // multipart/form-data以外はエラー
      return new Response(
        JSON.stringify({
          success: false,
          message: 'multipart/form-data形式でのリクエストが必要です'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 画像ファイル名をデータに追加
    data.images = uploadedImageNames

    // サーバー側バリデーション
    const validationResult = safeValidateRecordData(data)
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: validationResult.error
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 日付の処理
    let eventDate: Date
    try {
      // dateForFilenameがyyyyMMdd形式の場合
      if (dateForFilename && dateForFilename.length === 8) {
        eventDate = new Date(
          parseInt(dateForFilename.substring(0, 4)),
          parseInt(dateForFilename.substring(4, 6)) - 1,
          parseInt(dateForFilename.substring(6, 8))
        )
      } else {
        // 現在の日付を使用
        eventDate = new Date()
      }
    } catch (error) {
      eventDate = new Date()
    }

    // データベースに記録を保存
    const record = await RecordDB.createRecord({
      location: validationResult.data.location,
      datetime: validationResult.data.datetime,
      eventDate: eventDate,
      weather: validationResult.data.weather,
      participants: validationResult.data.participants,
      reporter: validationResult.data.reporter,
      content: validationResult.data.content,
      nearMiss: validationResult.data.nearMiss || null,
      equipment: validationResult.data.equipment || null,
      remarks: validationResult.data.remarks || null,
      categories: validationResult.data.categories || [],
      images: validationResult.data.images || [],
      status: validationResult.data.isDraft ? 'draft' : 'published',
      creatorId: locals.user.id
    })

    // 部分成功時の警告メッセージを生成
    let message = '活動記録を追加しました'
    if (totalImageCount > 0 && uploadedImageNames.length < totalImageCount) {
      message += `（画像: ${uploadedImageNames.length}/${totalImageCount}件アップロード成功）`
    }

    return new Response(
      JSON.stringify({
        success: true,
        message,
        record: record
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Record creation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '記録の作成に失敗しました'
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
