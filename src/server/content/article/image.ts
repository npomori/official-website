import { getArticleUploadConfig } from '@/types/config'
import { mkdir, rename, unlink } from 'node:fs/promises'
import { join } from 'node:path'

// MDX本文から /uploads/articles/... のURLを抽出
export function extractArticleImageUrls(content: string): string[] {
  if (!content) return []
  const uploadUrl = getArticleUploadConfig()?.url?.replace(/\/$/, '') || '/uploads/articles'
  const re = new RegExp(String.raw`${escapeRegExp(uploadUrl)}/[^\s"'()<>]+`, 'g')
  const set = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) set.add(m[0])
  return Array.from(set)
}

// URLからファイル名のみを取得（最後のセグメント）
export function urlToFilename(url: string): string | null {
  if (!url) return null
  const idx = url.lastIndexOf('/')
  if (idx === -1) return null
  return url.slice(idx + 1) || null
}

// 記事ID配下のURLか判定
export function isArticleScopedUrl(url: string, articleId: number): boolean {
  const uploadUrl = getArticleUploadConfig()?.url?.replace(/\/$/, '') || '/uploads/articles'
  return url.startsWith(`${uploadUrl}/${articleId}/`)
}

// ドラフト配下のURLか判定
export function isDraftScopedUrl(url: string, draftId: string): boolean {
  const uploadUrl = getArticleUploadConfig()?.url?.replace(/\/$/, '') || '/uploads/articles'
  return url.startsWith(`${uploadUrl}/_draft/${draftId}/`)
}

// 旧→新で削除された記事ID配下の画像だけ物理削除
export async function deleteUnusedArticleImages(
  oldContent: string,
  newContent: string,
  articleId: number
) {
  const uploadCfg = getArticleUploadConfig()
  const baseDir = join(process.cwd(), uploadCfg?.directory || 'public/uploads/articles')
  const oldUrls = extractArticleImageUrls(oldContent).filter((u) =>
    isArticleScopedUrl(u, articleId)
  )
  const newSet = new Set(
    extractArticleImageUrls(newContent).filter((u) => isArticleScopedUrl(u, articleId))
  )
  const targets = oldUrls.filter((u) => !newSet.has(u))
  if (targets.length === 0) return

  await Promise.all(
    targets.map(async (u) => {
      const filename = urlToFilename(u)
      if (!filename) return
      const filePath = join(baseDir, String(articleId), filename)
      try {
        await unlink(filePath)
      } catch {
        // ignore missing
      }
    })
  )
}

// 新規作成: ドラフト(_draft/{draftId})にある本文参照画像を {articleId} 配下へ移動し、本文URLを書き換える
export async function moveDraftImagesToArticle(
  draftId: string,
  articleId: number,
  content: string
): Promise<string> {
  if (!draftId || !content) return content
  const uploadCfg = getArticleUploadConfig()
  const uploadUrl = uploadCfg?.url?.replace(/\/$/, '') || '/uploads/articles'
  const baseDir = join(process.cwd(), uploadCfg?.directory || 'public/uploads/articles')

  const urls = extractArticleImageUrls(content).filter((u) => isDraftScopedUrl(u, draftId))
  if (urls.length === 0) return content

  // ensure target dir exists
  await mkdir(join(baseDir, String(articleId)), { recursive: true })

  let rewritten = content
  await Promise.all(
    urls.map(async (u) => {
      const filename = urlToFilename(u)
      if (!filename) return
      const from = join(baseDir, '_draft', draftId, filename)
      const to = join(baseDir, String(articleId), filename)
      try {
        await rename(from, to)
        const newUrl = `${uploadUrl}/${articleId}/${filename}`
        // 全置換
        rewritten = rewritten.split(u).join(newUrl)
      } catch {
        // ignore
      }
    })
  )

  return rewritten
}

// 本文から記事ID配下の画像ファイル名一覧を取得
export function collectImageNamesForArticle(content: string, articleId: number): string[] {
  const urls = extractArticleImageUrls(content).filter((u) => isArticleScopedUrl(u, articleId))
  const names = urls.map((u) => urlToFilename(u)).filter((v): v is string => !!v)
  return Array.from(new Set(names))
}

// 記事IDに依存せず、/uploads/articles/ 以下のURLからファイル名を収集
export function collectArticleImageNames(content: string): string[] {
  const urls = extractArticleImageUrls(content)
  const names = urls.map((u) => urlToFilename(u)).filter((v): v is string => !!v)
  return Array.from(new Set(names))
}

// 旧→新で削除されたファイル名をアップロードディレクトリから削除
export async function deleteUnusedArticleImagesByNames(
  oldNames: string[] | null | undefined,
  newNames: string[] | null | undefined
) {
  const uploadCfg = getArticleUploadConfig()
  const baseDir = join(process.cwd(), uploadCfg?.directory || 'public/uploads/articles')
  const oldSet = new Set(oldNames || [])
  const newSet = new Set(newNames || [])
  const targets = Array.from(oldSet).filter((n) => !newSet.has(n))
  if (targets.length === 0) return
  await Promise.all(
    targets.map(async (name) => {
      try {
        await unlink(join(baseDir, name))
      } catch {
        // ignore
      }
    })
  )
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
