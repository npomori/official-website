import {
  collectArticleImageNames,
  deleteUnusedArticleImagesByNames
} from '@/server/content/article/image'
import { ArticleDB } from '@/server/db'
import type { APIRoute } from 'astro'

// PUT /api/admin/article/[id] - update article
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ success: false, message: '認証が必要です' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const id = Number(params.id)
    if (!Number.isFinite(id)) {
      return new Response(JSON.stringify({ success: false, message: '不正なIDです' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 現在の本文を取得
    const current = await ArticleDB.getArticleByIdAdmin(id)
    if (!current) {
      return new Response(JSON.stringify({ success: false, message: '記事が見つかりません' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    const oldContent = String(current.content || '')

    const body = await request.json()
    const newContent: string = String(body.content ?? oldContent)

    // 先に本文更新
    await ArticleDB.updateArticle(id, {
      title: body.title,
      content: newContent,
      featuredImage: body.featuredImage,
      tags: body.tags,
      category: body.category,
      status: body.status,
      seoDescription: body.seoDescription,
      seoKeywords: body.seoKeywords,
      isMemberOnly: body.isMemberOnly
    })

    // 未使用画像のクリーンアップと images 再構築
    const oldNames = Array.isArray(current.images) ? (current.images as unknown as string[]) : []
    const imageNames = collectArticleImageNames(newContent)
    await deleteUnusedArticleImagesByNames(oldNames, imageNames)
    const finalArticle = await ArticleDB.updateArticle(id, { images: imageNames })

    return new Response(JSON.stringify({ success: true, data: finalArticle }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Article update error:', error)
    return new Response(JSON.stringify({ success: false, message: '記事の更新に失敗しました' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
