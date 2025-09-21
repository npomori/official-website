import { getArticleUploadConfig } from '@/types/config'
import type { APIRoute } from 'astro'
import { mkdir, writeFile } from 'node:fs/promises'
import { extname } from 'node:path'

const cfg = getArticleUploadConfig()
// 保存先: config.upload.article.directory
const UPLOAD_DIR = new URL(`../../../../../${cfg.directory}/`, import.meta.url)

function randomId(len = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

const ALLOWED = cfg.allowedTypes

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData()
    const file = form.get('file') as File | null

    if (!file) {
      return new Response(JSON.stringify({ success: false, message: 'file is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      })
    }

    if (!ALLOWED.includes(file.type)) {
      return new Response(JSON.stringify({ success: false, message: 'unsupported file type' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' }
      })
    }

    let ext = ''
    switch (file.type) {
      case 'image/jpeg':
        ext = '.jpg'
        break
      case 'image/png':
        ext = '.png'
        break
      case 'image/gif':
        ext = '.gif'
        break
      case 'image/webp':
        ext = '.webp'
        break
      default:
        ext = extname(file.name || '') || ''
    }

    const filename = `${Date.now()}_${randomId()}${ext}`

    await mkdir(UPLOAD_DIR, { recursive: true })
    const buf = Buffer.from(await file.arrayBuffer())
    await writeFile(new URL(filename, UPLOAD_DIR), buf)

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
    const fileUrl = new URL(filename, UPLOAD_DIR)
    const { unlink } = await import('node:fs/promises')
    try {
      await unlink(fileUrl)
    } catch {
      // ファイルが存在しない場合も 200 (冪等性)
    }
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
