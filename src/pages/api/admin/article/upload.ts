import FileUploader from '@/server/utils/file-upload'
import { getArticleUploadConfig } from '@/types/config'
import type { APIRoute } from 'astro'
import { join } from 'node:path'

const cfg = getArticleUploadConfig()
// 保存先: config.upload.article.directory
// 規約: ディレクトリへのアクセスは process.cwd() を基準に
const UPLOAD_DIR = join(process.cwd(), cfg.directory)
const uploader = new FileUploader(UPLOAD_DIR)
const ALLOWED = cfg.allowedTypes

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!cfg.enabled) {
      return new Response(
        JSON.stringify({ success: false, message: 'アップロードは無効化されています' }),
        { status: 403, headers: { 'content-type': 'application/json; charset=utf-8' } }
      )
    }
    const form = await request.formData()
    const file = form.get('file') as File | null

    if (!file) {
      return new Response(JSON.stringify({ success: false, message: 'file is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      })
    }

    // タイプ/サイズのバリデーション
    if (!uploader.validateFileType(file, ALLOWED)) {
      return new Response(JSON.stringify({ success: false, message: 'unsupported file type' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      })
    }
    if (!uploader.validateFileSize(file, cfg.maxFileSize)) {
      return new Response(JSON.stringify({ success: false, message: 'file too large' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      })
    }

    // 保存（FileUploader 経由）
    const saved = await uploader.uploadFile(file)
    const filename = saved.filename

    const baseUrl = cfg.url.replace(/\/$/, '')
    const url = `${baseUrl}/${filename}`

    return new Response(JSON.stringify({ success: true, data: { url } }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    })
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'upload failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    })
  }
}

export const DELETE: APIRoute = async ({ request }) => {
  try {
    if (!cfg.enabled) {
      return new Response(
        JSON.stringify({ success: false, message: 'アップロードは無効化されています' }),
        { status: 403, headers: { 'content-type': 'application/json; charset=utf-8' } }
      )
    }
    const { searchParams } = new URL(request.url)
    const urlParam = searchParams.get('url')
    if (!urlParam) {
      return new Response(JSON.stringify({ success: false, message: 'url is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      })
    }
    // 期待形式: <cfg.url>/<filename>
    const baseUrl = cfg.url.replace(/\/$/, '')
    if (!urlParam.startsWith(`${baseUrl}/`)) {
      return new Response(JSON.stringify({ success: false, message: 'invalid path' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      })
    }
    const filename = urlParam.replace(`${baseUrl}/`, '')
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new Response(JSON.stringify({ success: false, message: 'invalid filename' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      })
    }
    // FileUploader 経由で削除（存在しない場合も true/false で返るが 200 とする）
    await uploader.deleteFile(filename)
    return new Response(JSON.stringify({ success: true, data: { deleted: true } }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    })
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'delete failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    })
  }
}
