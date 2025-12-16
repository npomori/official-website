import LocationDB from '@/server/db/location'
import type { APIRoute } from 'astro'
import { promises as fs } from 'fs'
import path from 'path'

export const GET: APIRoute = async ({ params }) => {
  try {
    // URLパラメータから情報を取得
    const paramsArray = params.params?.split('/') || []
    if (paramsArray.length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'パラメータが無効です'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const locationId = paramsArray[0]
    const filename = paramsArray[1]

    if (!locationId || !filename) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'パラメータが不足しています'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 活動地とファイルの存在確認
    const location = await LocationDB.findById(locationId)
    if (!location) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '活動地が見つかりません'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 添付ファイルが存在するかチェック
    if (!location.attachments || !Array.isArray(location.attachments)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: '添付ファイルが見つかりません'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const attachment = location.attachments.find(
      (att: { filename: string; name: string }) => att.filename === filename
    )
    if (!attachment) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ファイルが見つかりません'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // ファイルパスを構築
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'locations')
    const filePath = path.join(uploadsDir, filename)

    try {
      // ファイルの存在確認
      await fs.access(filePath)

      // ファイルを読み込み
      const fileBuffer = await fs.readFile(filePath)

      // ファイル名をエンコード（日本語対応）
      const encodedFilename = encodeURIComponent(attachment.name)
      // ASCII文字のみのフォールバック名
      const asciiFilename = attachment.name.replace(/[^\x20-\x7E]/g, '_')
      const contentDisposition = `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodedFilename}`

      // レスポンスヘッダーを設定してファイルを送信
      return new Response(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Disposition': contentDisposition,
          'Content-Type': 'application/octet-stream',
          'Content-Length': fileBuffer.length.toString()
        }
      })
    } catch (fileError) {
      console.error('ファイル読み込みエラー:', fileError)
      return new Response(
        JSON.stringify({
          success: false,
          message: 'サーバー上でファイルが見つかりません'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('ダウンロードエラー:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'サーバーエラーが発生しました'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
