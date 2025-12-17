import { mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

/**
 * アップロードされた画像の情報
 */
export interface UploadedImageFile {
  /** 元のファイル名 */
  name: string
  /** 保存されたファイル名（UUID + .jpg） */
  filename: string
  /** ファイルサイズ（バイト） */
  size: number
}

/**
 * アップロード失敗した画像の情報
 */
export interface FailedImageFile {
  /** 元のファイル */
  file: File
  /** エラーメッセージ */
  error: string
}

/**
 * 複数画像処理の結果
 */
export interface ImageProcessingResult {
  /** 成功した画像 */
  succeeded: UploadedImageFile[]
  /** 失敗した画像 */
  failed: FailedImageFile[]
}

/**
 * 画像処理設定
 */
export interface ImageProcessingConfig {
  /** アップロード先ディレクトリ（process.cwd()からの相対パス） */
  directory: string
  /** サブディレクトリ（オプション） */
  subDirectory?: string
  /** 最大幅 */
  maxWidth: number
  /** 最大高さ */
  maxHeight: number
  /** JPEG品質（1-100） */
  quality: number
  /** 許可するファイルタイプ（MIMEタイプ） */
  allowedTypes: string[]
  /** 最大ファイルサイズ（バイト） */
  maxFileSize: number
}

/**
 * 単一の画像をリサイズしてJPEG形式で保存
 *
 * @param file - アップロードされた画像ファイル
 * @param config - 画像処理設定
 * @returns アップロードされた画像の情報
 * @throws バリデーションエラーまたは処理エラー
 */
export async function processImageWithResize(
  file: File,
  config: ImageProcessingConfig
): Promise<UploadedImageFile> {
  // ファイル形式チェック
  if (!config.allowedTypes.includes(file.type)) {
    throw new Error(`対応していないファイル形式です。対応形式: ${config.allowedTypes.join(', ')}`)
  }

  // ファイルサイズチェック
  if (file.size > config.maxFileSize) {
    const maxSizeMB = Math.round(config.maxFileSize / (1024 * 1024))
    throw new Error(`ファイルサイズは${maxSizeMB}MB以下にしてください`)
  }

  // アップロードディレクトリを作成
  const uploadDir = config.subDirectory
    ? join(process.cwd(), config.directory, config.subDirectory)
    : join(process.cwd(), config.directory)
  await mkdir(uploadDir, { recursive: true })

  // ファイル名を生成（UUID + .jpg）
  const fileName = `${uuidv4()}.jpg`
  const uploadPath = join(uploadDir, fileName)

  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 画像をリサイズしてJPEG形式で保存
    const info = await sharp(buffer)
      .resize(config.maxWidth, config.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: config.quality })
      .toFile(uploadPath)

    return {
      name: file.name,
      filename: fileName,
      size: info.size
    }
  } catch (error) {
    console.error('Image processing error:', error)
    throw new Error(`画像の処理に失敗しました: ${file.name}`)
  }
}

/**
 * 複数の画像をリサイズしてJPEG形式で保存（部分成功対応）
 *
 * 個別の画像でエラーが発生しても処理を継続し、成功した画像と失敗した画像を返します。
 *
 * @param files - アップロードされた画像ファイルの配列
 * @param config - 画像処理設定
 * @returns 成功した画像と失敗した画像のリスト
 */
export async function processImagesWithResize(
  files: File[],
  config: ImageProcessingConfig
): Promise<ImageProcessingResult> {
  const succeeded: UploadedImageFile[] = []
  const failed: FailedImageFile[] = []

  // 各画像を個別に処理（エラーが発生しても継続）
  // 順次処理が必要なため、ループ内でawaitを使用
  for (const file of files) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const uploadedFile = await processImageWithResize(file, config)
      succeeded.push(uploadedFile)
    } catch (error) {
      failed.push({
        file,
        error: error instanceof Error ? error.message : '画像の処理に失敗しました'
      })
    }
  }

  return { succeeded, failed }
}
