import { safeValidateRecordData } from '@/schemas/record'
import { RecordDB } from '@/server/db'
import { getRecordUploadConfig } from '@/types/config'
import type { APIRoute } from 'astro'
import { mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

// 削除された画像ファイルを物理的に削除する関数
async function deleteImageFiles(imageNames: string[], recordConfig: any) {
  const uploadDir = join(process.cwd(), recordConfig.directory)

  for (const imageName of imageNames) {
    try {
      const imagePath = join(uploadDir, imageName)
      await unlink(imagePath)
      console.log(`Deleted image file: ${imageName}`)
    } catch (error) {
      console.error(`Failed to delete image file: ${imageName}`, error)
      // ファイルが存在しない場合もエラーになるが、削除目的なので無視
    }
  }
}

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

    const recordDB = new RecordDB()
    const record = await recordDB.getRecordById(recordId)

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
    const recordDB = new RecordDB()
    const existingRecord = await recordDB.getRecordById(recordId)

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

      // アップロードディレクトリを作成
      const uploadDir = join(process.cwd(), recordConfig.directory)
      await mkdir(uploadDir, { recursive: true })

      uploadedImageNames = await Promise.all(
        images.map(async (file) => {
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
      await deleteImageFiles(deletedImages, recordConfig)
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
    const updatedRecord = await recordDB.updateRecord(recordId, {
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

    return new Response(
      JSON.stringify({
        success: true,
        message: '記録を更新しました',
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
    const recordDB = new RecordDB()
    const existingRecord = await recordDB.getRecordById(recordId)

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
      await deleteImageFiles(existingImages, recordConfig)
    }

    // 記録を削除
    const deleteResult = await recordDB.deleteRecord(recordId)
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
