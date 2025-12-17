import { safeValidateRecordData } from '@/schemas/record'
import { RecordDB } from '@/server/db'
import FileUploader from '@/server/utils/file-upload'
import { processImagesWithResize } from '@/server/utils/image-processor'
import { getRecordUploadConfig } from '@/types/config'
import type { APIRoute } from 'astro'
import { join } from 'path'

// 個別の記録を取得
export const GET: APIRoute = async ({ params, locals }) => {
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

    const recordId = parseInt(params.id || '0')
    if (!recordId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '無効な記録IDです'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const record = await RecordDB.getRecordById(recordId)

    if (!record) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '記録が見つかりません'
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
        data: record
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Record fetch error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '記録の取得に失敗しました'
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

// 記録を更新
export const PUT: APIRoute = async ({ params, request, locals }) => {
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

    const recordId = parseInt(params.id || '0')
    if (!recordId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '無効な記録IDです'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 既存の記録を取得
    const existingRecord = await RecordDB.getRecordById(recordId)

    if (!existingRecord) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '記録が見つかりません'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 権限チェック
    const canEdit =
      locals.user.role === 'ADMIN' ||
      locals.user.role === 'MODERATOR' ||
      (locals.user.role === 'EDITOR' && existingRecord.creatorId === locals.user.id)

    if (!canEdit) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'この記録を編集する権限がありません'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Content-Typeをチェックして、FormDataかJSONかを判定
    const contentType = request.headers.get('content-type') || ''
    let body: any
    let images: File[] = []

    if (contentType.includes('multipart/form-data')) {
      // FormDataの場合
      const formData = await request.formData()
      const dataStr = formData.get('data') as string
      body = JSON.parse(dataStr)

      // 画像ファイルを取得
      const imageFiles = formData.getAll('images')
      images = imageFiles.filter((file): file is File => file instanceof File)
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

    // 画像アップロード処理
    let uploadedImageNames: string[] = []
    let totalNewImageCount = 0
    if (images.length > 0) {
      const recordConfig = getRecordUploadConfig()

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
      if (images.length > recordConfig.maxFiles) {
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

      totalNewImageCount = images.length

      // 画像をリサイズ処理（部分成功対応）
      const processingResult = await processImagesWithResize(images, {
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

    // サーバー側バリデーション
    const validationResult = safeValidateRecordData(body)
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
      if (body.datetime) {
        // 既存の記録のeventDateを使用（datetimeは表示用の文字列）
        eventDate = existingRecord.eventDate
      } else {
        eventDate = existingRecord.eventDate
      }
    } catch (error) {
      eventDate = existingRecord.eventDate
    }

    // 画像ファイル名を処理
    let finalImages: string[] = []
    const existingImages = (existingRecord.images as string[]) || []

    // 削除された画像を特定して物理的に削除
    const deletedImages = existingImages.filter(
      (image) => !validationResult.data.images?.includes(image)
    )
    if (deletedImages.length > 0) {
      const recordConfig = getRecordUploadConfig()
      const uploadDir = join(process.cwd(), recordConfig.directory)
      const fileUploader = new FileUploader(uploadDir)
      try {
        await fileUploader.deleteFiles(deletedImages)
      } catch (deleteError) {
        console.error('Failed to delete image files:', deleteError)
        // 物理削除に失敗してもデータベースからは削除する（既に削除済みの可能性もあるため）
      }
    }

    if (uploadedImageNames.length > 0) {
      // 新しい画像がアップロードされた場合、削除されていない既存画像と新しい画像を結合
      const remainingExistingImages = existingImages.filter(
        (image) => !deletedImages.includes(image)
      )
      finalImages = [...remainingExistingImages, ...uploadedImageNames]
    } else {
      // 新しい画像がない場合、送信された画像を使用（削除された画像は既に除外済み）
      finalImages = validationResult.data.images || []
    }

    // 記録を更新
    const updatedRecord = await RecordDB.updateRecord(recordId, {
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
      images: finalImages
    })

    // 部分成功時の警告メッセージを生成
    let message = '記録を更新しました'
    if (totalNewImageCount > 0 && uploadedImageNames.length < totalNewImageCount) {
      message += `（画像: ${uploadedImageNames.length}/${totalNewImageCount}件アップロード成功）`
    }

    return new Response(
      JSON.stringify({
        success: true,
        message,
        data: updatedRecord
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Record update error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '記録の更新に失敗しました'
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

// 記録を削除
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    const recordId = parseInt(params.id || '0')
    if (!recordId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '無効な記録IDです'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 既存の記録を取得
    const existingRecord = await RecordDB.getRecordById(recordId)

    if (!existingRecord) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '記録が見つかりません'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 権限チェック
    const canDelete =
      locals.user.role === 'ADMIN' ||
      locals.user.role === 'MODERATOR' ||
      (locals.user.role === 'EDITOR' && existingRecord.creatorId === locals.user.id)

    if (!canDelete) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'この記録を削除する権限がありません'
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // 記録に紐づく画像ファイルを削除
    const existingImages = existingRecord.images as string[]
    if (existingImages && existingImages.length > 0) {
      const recordConfig = getRecordUploadConfig()
      const uploadDir = join(process.cwd(), recordConfig.directory)
      const fileUploader = new FileUploader(uploadDir)
      try {
        await fileUploader.deleteFiles(existingImages)
      } catch (deleteError) {
        console.error('Failed to delete image files:', deleteError)
        // 物理削除に失敗してもデータベースからは削除する（既に削除済みの可能性もあるため）
      }
    }

    // 記録を削除
    const deleteResult = await RecordDB.deleteRecord(recordId)
    if (!deleteResult) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '記録の削除に失敗しました'
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
        message: '記録を削除しました'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Record deletion error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '記録の削除に失敗しました'
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
