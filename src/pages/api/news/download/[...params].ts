import newsDB from '@/server/db/news'
import type { APIRoute } from 'astro'
import { promises as fs } from 'fs'
import path from 'path'

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // URLパラメータから情報を取得
    const paramsArray = params.params?.split('/') || []
    if (paramsArray.length < 2) {
      return new Response(JSON.stringify({ error: 'Invalid parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const newsIdStr = paramsArray[0]
    const filename = paramsArray[1]

    if (!newsIdStr || !filename) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const newsId = parseInt(newsIdStr, 10)

    if (isNaN(newsId)) {
      return new Response(JSON.stringify({ error: 'Invalid news ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // ユーザーのログイン状態を取得
    const user = locals.user
    const isLoggedIn = !!user

    // お知らせとファイルの存在確認
    const news = await newsDB.getNewsById(newsId)
    if (!news) {
      return new Response(JSON.stringify({ error: 'News not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 会員限定コンテンツの場合、ログインチェック
    if (news.isMemberOnly && !isLoggedIn) {
      return new Response(JSON.stringify({ error: 'ログインが必要です' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 添付ファイルが存在するかチェック
    if (!news.attachments || !Array.isArray(news.attachments)) {
      return new Response(JSON.stringify({ error: 'No attachments found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const attachment = news.attachments.find(
      (att: { filename: string; originalName: string }) => att.filename === filename
    )
    if (!attachment) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // ファイルパスを構築
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'news')
    const filePath = path.join(uploadsDir, filename)

    try {
      // ファイルの存在確認
      await fs.access(filePath)

      // ダウンロード回数を記録
      await newsDB.recordDownload(newsId, filename)

      // ファイルを読み込み
      const fileBuffer = await fs.readFile(filePath)

      // ファイル名をエンコード（日本語対応）
      const encodedFilename = encodeURIComponent(attachment.originalName)
      // ASCII文字のみのフォールバック名
      const asciiFilename = attachment.originalName.replace(/[^\x20-\x7E]/g, '_')
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
      return new Response(JSON.stringify({ error: 'File not found on server' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error('ダウンロードエラー:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
