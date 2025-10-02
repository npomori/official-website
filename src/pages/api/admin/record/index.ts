import { safeValidateRecordData } from '@/schemas/record'
import { RecordDB } from '@/server/db'
import { getConfig, getRecordUploadConfig } from '@/types/config'
import type { APIRoute } from 'astro'
import { mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

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

    if (contentType.includes('multipart/form-data')) {
      // FormDataの場合（画像付き）
      const formData = await request.formData()
      dateForFilename = formData.get('dateForFilename') as string
      const dataJson = formData.get('data') as string
      data = JSON.parse(dataJson)

      // 画像ファイルの処理
      const imageFiles = formData.getAll('images') as File[]

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

        // アップロードディレクトリを作成
        const uploadDir = join(process.cwd(), recordConfig.directory)
        await mkdir(uploadDir, { recursive: true })

        uploadedImageNames = await Promise.all(
          imageFiles.map(async (file, index) => {
            // ファイル形式チェック
            if (!recordConfig.allowedTypes.includes(file.type)) {
              throw new Error(
                `対応していないファイル形式です。対応形式: ${recordConfig.allowedTypes.join(', ')}`
              )
            }

            // ファイルサイズチェック
            if (file.size > recordConfig.maxFileSize) {
              const maxSizeMB = Math.round(recordConfig.maxFileSize / (1024 * 1024))
              throw new Error(`ファイルサイズは${maxSizeMB}MB以下にしてください`)
            }

            // ファイル名を生成（UUID + 元の拡張子）
            const fileExtension = file.name.split('.').pop()
            const fileName = `${uuidv4()}.${fileExtension}`
            const uploadPath = join(uploadDir, fileName)

            try {
              const bytes = await file.arrayBuffer()
              const buffer = Buffer.from(bytes)

              // 画像をリサイズして保存
              await sharp(buffer)
                .resize(recordConfig.maxSize.width, recordConfig.maxSize.height, {
                  fit: 'inside',
                  withoutEnlargement: true
                })
                .jpeg({ quality: recordConfig.quality })
                .toFile(uploadPath)

              return fileName
            } catch (error) {
              console.error('Image upload error:', error)
              throw new Error('画像のアップロードに失敗しました')
            }
          })
        )
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
      status: 'published',
      creatorId: locals.user.id
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: '活動記録を追加しました',
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
