import LocationDB from '@/server/db/location'
import FileUploader from '@/server/utils/file-upload'
import { getLocationUploadConfig } from '@/types/config'
import type { APIRoute } from 'astro'
import { join } from 'path'

const cfg = getLocationUploadConfig()
const UPLOAD_DIR = join(process.cwd(), cfg.directory)

const locationDB = new LocationDB()

// 管理者用の個別活動地取得
export const GET: APIRoute = async ({ params }) => {
  try {
    const id = params.id as string

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: '無効なIDです' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    const location = await locationDB.findByIdAdmin(id)

    if (!location) {
      return new Response(JSON.stringify({ success: false, message: '活動地が見つかりません' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: location
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Admin location fetch error:', error)
    const errorMessage = error instanceof Error ? error.message : '活動地の取得に失敗しました'
    return new Response(JSON.stringify({ success: false, message: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}

// 管理者用の活動地更新
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = params.id as string

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: '無効なIDです' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // Content-Typeを確認
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ success: false, message: 'multipart/form-data で送信してください' }),
        { status: 415, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const formData = await request.formData()

    // 活動地が存在するか確認
    const existingLocation = await locationDB.findByIdAdmin(id)

    if (!existingLocation) {
      return new Response(JSON.stringify({ success: false, message: '活動地が見つかりません' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // 基本情報
    const name = formData.get('name') as string
    const address = formData.get('address') as string | null
    const type = formData.get('type') as string
    const activities = formData.get('activities') as string | null
    const hasDetail = formData.get('hasDetail') === 'true'
    const isDraft = formData.get('isDraft') === 'true'

    // 位置情報
    const positionStr = formData.get('position') as string
    const position = positionStr ? JSON.parse(positionStr) : existingLocation.position

    // 詳細情報
    const activityDetails = formData.get('activityDetails') as string | null
    const fieldCharacteristics = formData.get('fieldCharacteristics') as string | null
    const access = formData.get('access') as string | null
    const facilities = formData.get('facilities') as string | null
    const schedule = formData.get('schedule') as string | null
    const requirements = formData.get('requirements') as string | null
    const participationFee = formData.get('participationFee') as string | null
    const contact = formData.get('contact') as string | null
    const notes = formData.get('notes') as string | null
    const other = formData.get('other') as string | null

    // 集合場所情報
    const meetingAddress = formData.get('meetingAddress') as string | null
    const meetingTime = formData.get('meetingTime') as string | null
    const meetingMapUrl = formData.get('meetingMapUrl') as string | null
    const meetingAdditionalInfo = formData.get('meetingAdditionalInfo') as string | null

    // 活動予定日（textarea改行区切りから配列へ変換）
    const upcomingDatesStr = formData.get('upcomingDates') as string
    const upcomingDates = upcomingDatesStr
      ? upcomingDatesStr
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
      : null

    // 削除対象ギャラリー画像
    const removedImagesStr = formData.get('removedImages') as string
    const removedImages = removedImagesStr ? JSON.parse(removedImagesStr) : []

    const locationFileUploader = new FileUploader(UPLOAD_DIR)
    const locationConfig = (await import('@/config/config.json')).default.upload.location

    // メイン画像の更新
    let mainImageUrl = existingLocation.image
    const mainImageFile = formData.get('image') as File | null
    if (mainImageFile && mainImageFile.size > 0) {
      // ファイルのバリデーション
      if (!locationFileUploader.validateFileType(mainImageFile, locationConfig.allowedTypes)) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `画像ファイルタイプが許可されていません: ${mainImageFile.name}`
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }

      if (!locationFileUploader.validateFileSize(mainImageFile, locationConfig.maxFileSize)) {
        const maxSizeMB = Math.round(locationConfig.maxFileSize / (1024 * 1024))
        return new Response(
          JSON.stringify({
            success: false,
            message: `画像ファイルサイズが大きすぎます: ${mainImageFile.name} (最大${maxSizeMB}MB)`
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }

      // ファイルをアップロード
      try {
        const uploadedFiles = await locationFileUploader.uploadFiles([mainImageFile])
        if (uploadedFiles && uploadedFiles.length > 0 && uploadedFiles[0]) {
          mainImageUrl = `${cfg.url}/${uploadedFiles[0].filename}`
        }
      } catch (uploadError) {
        console.error('Main image upload error:', uploadError)
        return new Response(
          JSON.stringify({
            success: false,
            message: 'メイン画像のアップロードに失敗しました'
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

    // ギャラリー画像の更新
    let galleryImages = (existingLocation.images as string[]) || []

    // 削除対象を除外
    if (removedImages.length > 0) {
      galleryImages = galleryImages.filter((img) => !removedImages.includes(img))
    }

    // 新規ギャラリー画像のアップロード
    const galleryFiles = formData.getAll('gallery') as File[]
    if (galleryFiles && galleryFiles.length > 0) {
      // ファイル数のバリデーション（既存 + 新規）
      const totalFileCount = galleryImages.length + galleryFiles.length
      if (totalFileCount > locationConfig.maxFiles) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `ギャラリー画像数が多すぎます (最大${locationConfig.maxFiles}個)`
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
      for (const file of galleryFiles) {
        if (!locationFileUploader.validateFileType(file, locationConfig.allowedTypes)) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `ギャラリー画像ファイルタイプが許可されていません: ${file.name}`
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          )
        }

        if (!locationFileUploader.validateFileSize(file, locationConfig.maxFileSize)) {
          const maxSizeMB = Math.round(locationConfig.maxFileSize / (1024 * 1024))
          return new Response(
            JSON.stringify({
              success: false,
              message: `ギャラリー画像ファイルサイズが大きすぎます: ${file.name} (最大${maxSizeMB}MB)`
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
        const uploadedFiles = await locationFileUploader.uploadFiles(galleryFiles)
        const newImages = uploadedFiles.map((f) => `${cfg.url}/${f.filename}`)
        galleryImages = [...galleryImages, ...newImages]
      } catch (uploadError) {
        console.error('Gallery upload error:', uploadError)
        return new Response(
          JSON.stringify({
            success: false,
            message: 'ギャラリー画像のアップロードに失敗しました'
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

    // 添付ファイルの更新
    let existingAttachments =
      (existingLocation.attachments as Array<{
        name: string
        url: string
        size: string
      }>) || []

    // 新規添付ファイルのアップロード
    const attachmentFiles = formData.getAll('attachments') as File[]
    if (attachmentFiles && attachmentFiles.length > 0) {
      // ファイル数のバリデーション（既存 + 新規）
      const totalFileCount = existingAttachments.length + attachmentFiles.length
      if (totalFileCount > locationConfig.maxFiles) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `添付ファイル数が多すぎます (最大${locationConfig.maxFiles}個)`
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }

      // ファイルサイズのバリデーション
      for (const file of attachmentFiles) {
        if (!locationFileUploader.validateFileSize(file, locationConfig.maxFileSize)) {
          const maxSizeMB = Math.round(locationConfig.maxFileSize / (1024 * 1024))
          return new Response(
            JSON.stringify({
              success: false,
              message: `添付ファイルサイズが大きすぎます: ${file.name} (最大${maxSizeMB}MB)`
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
        const uploadedFiles = await locationFileUploader.uploadFiles(attachmentFiles)
        const newAttachments = uploadedFiles.map((f) => ({
          name: f.originalName,
          url: `${cfg.url}/${f.filename}`,
          size: `${Math.round(f.originalName.length / 1024)}KB`
        }))
        existingAttachments = [...existingAttachments, ...newAttachments]
      } catch (uploadError) {
        console.error('Attachments upload error:', uploadError)
        return new Response(
          JSON.stringify({
            success: false,
            message: '添付ファイルのアップロードに失敗しました'
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

    // DBを更新
    const updatedLocation = await locationDB.update(id, {
      name,
      position,
      type,
      activities,
      image: mainImageUrl,
      address,
      hasDetail,
      activityDetails,
      fieldCharacteristics,
      meetingAddress,
      meetingTime,
      meetingMapUrl,
      meetingAdditionalInfo,
      access,
      facilities,
      schedule,
      requirements,
      participationFee,
      contact,
      ...(upcomingDates && { upcomingDates }),
      notes,
      other,
      ...(galleryImages.length > 0 && { images: galleryImages }),
      ...(existingAttachments.length > 0 && { attachments: existingAttachments }),
      status: isDraft ? 'draft' : 'published'
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedLocation,
        message: '活動地を更新しました'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Location update error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '活動地の更新に失敗しました'
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

// 管理者用の活動地削除
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = params.id as string

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: '無効なIDです' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // 活動地が存在するか確認
    const existingLocation = await locationDB.findByIdAdmin(id)

    if (!existingLocation) {
      return new Response(JSON.stringify({ success: false, message: '活動地が見つかりません' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json'
        }
      })
    }

    // 削除実行
    await locationDB.delete(id)

    return new Response(
      JSON.stringify({
        success: true,
        message: '活動地を削除しました'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Location deletion error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '活動地の削除に失敗しました'
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
