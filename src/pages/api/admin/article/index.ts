import { collectArticleImageNames } from '@/server/content/article/image'
import { ArticleDB } from '@/server/db'
import type { APIRoute } from 'astro'

// POST /api/admin/article - create article (JSON body)
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    if (!locals.user) {
      return new Response(JSON.stringify({ success: false, message: '認証が必要です' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const body = await request.json()
    // 最低限のバリデーション（必要に応じて schemas を追加）
    if (!body.title || typeof body.content !== 'string') {
      return new Response(JSON.stringify({ success: false, message: 'タイトルと本文は必須です' }), {
        status: 422,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const content: string = String(body.content || '')
    const imageNames = collectArticleImageNames(content)

    const created = await ArticleDB.createArticle({
      title: String(body.title),
      content,
      featuredImage: body.featuredImage || null,
      images: imageNames,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      tags: Array.isArray(body.tags) ? body.tags : [],
      category: body.category || null,
      status: body.status || 'draft',
      seoDescription: body.seoDescription || null,
      seoKeywords: body.seoKeywords || null,
      isMemberOnly: !!body.isMemberOnly,
      creatorId: locals.user.id
    })

    return new Response(JSON.stringify({ success: true, data: created }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Article create error:', error)
    return new Response(JSON.stringify({ success: false, message: '記事の作成に失敗しました' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
