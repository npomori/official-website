import LocationDB from '@/server/db/location'
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

    // filenameから活動地を検索して添付ファイル情報を取得
    const locations = await LocationDB.findAllWithAttachment(filename)
    let attachment: { name: string; filename: string } | null = null

    // 添付ファイルを探す
    for (const location of locations) {
      if (location.attachments && Array.isArray(location.attachments)) {
        const found = (
          location.attachments as Array<{ name: string; filename: string; size: number }>
        ).find((att) => att.filename === filename)
        if (found) {
          attachment = found
          break
        }
      }
    }

    if (!attachment) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '添付ファイルが見つかりません'
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // ファイルパスを構築
    const filePath = join('public/uploads/locations', filename)

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

    // ファイル名をエンコード（日本語対応）
    const encodedFilename = encodeURIComponent(attachment.name)
    // ASCII文字のみのフォールバック名
    const asciiFilename = attachment.name.replace(/[^\x20-\x7E]/g, '_')
    const contentDisposition = `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': contentDisposition,
        'Content-Length': fileBuffer.length.toString(),
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
