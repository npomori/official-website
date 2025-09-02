import { ArticleDB } from '@/server/db'
import type { ArticleListResponse } from '@/types/article'
import { getConfig } from '@/types/config'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const searchParams = url.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category') || undefined
    const tags = searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined

    // 設定からデフォルト値を取得
    const config = getConfig()
    const defaultLimit = config.pagination?.articleList?.itemsPerPage || 10
    const itemsPerPage = limit > 0 ? limit : defaultLimit

    // ユーザーのログイン状態を取得
    const user = locals.user
    const isLoggedIn = !!user

    // 記事一覧を取得（ページネーション対応）
    const { articles, totalCount } = await ArticleDB.getArticlesWithPagination(
      page,
      itemsPerPage,
      false, // 管理権限なし
      isLoggedIn, // ログイン状態を追加
      category,
      tags
    )

    // ページネーション情報を計算
    const totalPages = Math.ceil(totalCount / itemsPerPage)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          articles,
          pagination: {
            currentPage: page,
            itemsPerPage,
            totalCount,
            totalPages
          }
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Articles API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: '記事データの取得に失敗しました'
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
