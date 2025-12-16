import config from '@/config/config.json'
import LocationDB from '@/server/db/location'
import FileUploader from '@/server/utils/file-upload'
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

    // メイン画像のアップロード
    let mainImageUrl: string | null = null
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

    // ギャラリー画像のアップロード
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
        const subDir = cfg.subDirectories?.gallery || 'gallery'
        const uploadedFiles = await locationFileUploader.uploadFiles(galleryFiles, subDir)
        galleryImages = uploadedFiles.map((f, index) => {
          const caption = formData.get(`gallery_caption_${index}`) as string | null
          return {
            name: f.name,
            filename: f.filename,
            size: f.size,
            ...(caption && { caption })
          }
        })
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
      ...(galleryImages.length > 0 && { images: galleryImages }),
      ...(uploadedAttachments.length > 0 && { attachments: uploadedAttachments }),
      status: isDraft ? 'draft' : 'published',
      creator: {
        connect: {
          id: locals.user!.id
        }
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        data: createdLocation,
        message: '活動地を作成しました'
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
