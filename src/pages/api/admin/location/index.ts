import config from '@/config/config.json'
import LocationDB from '@/server/db/location'
import FileUploader from '@/server/utils/file-upload'
import { processImageWithResize, processImagesWithResize } from '@/server/utils/image-processor'
import { getLocationUploadConfig } from '@/types/config'
import type { APIRoute } from 'astro'
import { join } from 'path'

const cfg = getLocationUploadConfig()
const UPLOAD_DIR = join(process.cwd(), cfg.directory)

// 管理者用の活動地一覧取得
export const GET: APIRoute = async () => {
  try {
    const locations = await LocationDB.findAllAdmin()

    return new Response(
      JSON.stringify({
        success: true,
        data: { locations }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Location API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '活動地データの取得に失敗しました'
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

// 管理者用の活動地作成
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData()

    // 基本情報
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const address = formData.get('address') as string | null
    const type = formData.get('type') as string
    const activities = formData.get('activities') as string | null
    const hasDetail = formData.get('hasDetail') === 'true'
    const isDraft = formData.get('isDraft') === 'true'

    // 位置情報
    const positionStr = formData.get('position') as string
    const position = positionStr ? JSON.parse(positionStr) : []

    // 詳細情報
    const activityDetails = formData.get('activityDetails') as string | null
    const fieldCharacteristics = formData.get('fieldCharacteristics') as string | null
    const access = formData.get('access') as string | null
    const facilities = formData.get('facilities') as string | null
    const schedule = formData.get('schedule') as string | null
    const requirements = formData.get('requirements') as string | null
    const participationFee = formData.get('participationFee') as string | null
    const contact = formData.get('contact') as string | null
    const organizer = formData.get('organizer') as string | null
    const startedDate = formData.get('startedDate') as string | null
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

    const locationFileUploader = new FileUploader(UPLOAD_DIR)
    const locationConfig = config.upload.location

    // メイン画像のアップロード（リサイズ処理を適用）
    let mainImageUrl: string | null = null
    const mainImageFile = formData.get('image') as File | null
    if (mainImageFile && mainImageFile.size > 0) {
      try {
        const uploadedImage = await processImageWithResize(mainImageFile, {
          directory: cfg.directory,
          maxWidth: locationConfig.maxSize.width,
          maxHeight: locationConfig.maxSize.height,
          quality: locationConfig.quality,
          allowedTypes: locationConfig.allowedTypes,
          maxFileSize: locationConfig.maxFileSize
        })
        mainImageUrl = `${cfg.url}/${uploadedImage.filename}`
      } catch (error) {
        console.error('Main image upload error:', error)
        const errorMessage =
          error instanceof Error ? error.message : 'メイン画像のアップロードに失敗しました'
        return new Response(
          JSON.stringify({
            success: false,
            message: errorMessage
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

    // ギャラリー画像のアップロード（リサイズ処理を適用）
    let galleryImages: Array<{
      name: string
      filename: string
      size: number
      caption?: string
    }> = []
    const galleryFiles = formData.getAll('gallery') as File[]
    if (galleryFiles && galleryFiles.length > 0) {
      // ファイル数のバリデーション
      if (!locationFileUploader.validateFileCount(galleryFiles, locationConfig.maxFiles)) {
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

      // 画像処理（部分成功対応）
      const subDir = cfg.subDirectories?.gallery || 'gallery'
      const processingResult = await processImagesWithResize(galleryFiles, {
        directory: cfg.directory,
        subDirectory: subDir,
        maxWidth: locationConfig.maxSize.width,
        maxHeight: locationConfig.maxSize.height,
        quality: locationConfig.quality,
        allowedTypes: locationConfig.allowedTypes,
        maxFileSize: locationConfig.maxFileSize
      })

      // 成功した画像をギャラリーに追加
      galleryImages = processingResult.succeeded.map((f, index) => {
        const caption = formData.get(`gallery_caption_${index}`) as string | null
        return {
          name: f.name,
          filename: f.filename,
          size: f.size,
          ...(caption && { caption })
        }
      })

      // 失敗した画像がある場合はログに記録
      if (processingResult.failed.length > 0) {
        console.warn('Some gallery images failed to upload:', processingResult.failed)
      }
    }

    // 添付ファイルのアップロード
    let uploadedAttachments: Array<{
      name: string
      filename: string
      size: number
    }> = []
    const attachmentFiles = formData.getAll('attachments') as File[]
    if (attachmentFiles && attachmentFiles.length > 0) {
      // ファイル数のバリデーション
      if (!locationFileUploader.validateFileCount(attachmentFiles, locationConfig.maxFiles)) {
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
        const subDir = cfg.subDirectories?.attachments || 'attachments'
        const uploadedFiles = await locationFileUploader.uploadFiles(attachmentFiles, subDir)
        uploadedAttachments = uploadedFiles.map((f) => ({
          name: f.name,
          filename: f.filename,
          size: f.size
        }))
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

    // DBに保存
    const createdLocation = await LocationDB.create({
      id,
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
      organizer,
      startedDate,
      ...(upcomingDates && { upcomingDates }),
      notes,
      other,
      ...(galleryImages.length > 0 && { gallery: galleryImages }),
      ...(uploadedAttachments.length > 0 && { attachments: uploadedAttachments }),
      status: isDraft ? 'draft' : 'published',
      creator: {
        connect: {
          id: locals.user!.id
        }
      }
    })

    // 部分成功時の警告メッセージを生成
    let message = '活動地を作成しました'
    const galleryFailedCount = galleryFiles.length - galleryImages.length
    if (galleryFailedCount > 0) {
      message += `（ギャラリー画像: ${galleryImages.length}/${galleryFiles.length}件アップロード成功）`
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: createdLocation,
        message
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Location creation error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '活動地の作成に失敗しました'
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
