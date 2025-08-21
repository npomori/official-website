import NewsDB from '@/server/db/news'
import type { APIRoute } from 'astro'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const GET: APIRoute = async ({ params }) => {
  try {
    const filename = params.filename

    if (!filename) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ファイル名が指定されていません'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // データベースから添付ファイル情報を取得
    const attachment = await NewsDB.getAttachmentByFilename(filename)

    // 添付ファイル情報が見つからない場合、ファイル名をそのまま使用（旧形式のデータ対応）
    let originalFileName = filename
    if (attachment?.originalName) {
      originalFileName = attachment.originalName
    }

    // ファイルパスを構築
    const filePath = join('public/uploads/news', filename)

    // ファイルが存在するかチェック
    if (!existsSync(filePath)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ファイルが見つかりません'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // ファイルを読み込み
    const fileBuffer = await readFile(filePath)

    // ファイルのMIMEタイプを決定
    const mimeType = getMimeType(filename)

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(originalFileName)}"`,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    console.error('File download error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'ファイルのダウンロードに失敗しました'
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

/**
 * ファイル拡張子からMIMEタイプを取得
 */
function getMimeType(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'pdf':
      return 'application/pdf'
    case 'doc':
      return 'application/msword'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'xls':
      return 'application/vnd.ms-excel'
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'gif':
      return 'image/gif'
    default:
      return 'application/octet-stream'
  }
}
