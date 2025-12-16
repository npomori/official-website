import { NewsDB } from '@/server/db'
import { getConfig } from '@/types/config'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const searchParams = url.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category') || undefined
    const priority = searchParams.get('priority') || undefined

    // 設定からデフォルト値を取得
    const config = getConfig()
    const defaultLimit = config.pagination?.newsList?.itemsPerPage || 10
    const itemsPerPage = limit > 0 ? limit : defaultLimit

    // ユーザーのログイン状態を取得
    const user = locals.user
    const isLoggedIn = !!user

    // 管理権限なしでフロントエンド用のお知らせを取得（ページネーション対応）
    const { news, totalCount } = await NewsDB.getNewsWithPagination(
      page,
      itemsPerPage,
      false, // 管理権限なし
      isLoggedIn, // ログイン状態を追加
      category,
      priority
    )

    // ページネーション情報を計算
    const totalPages = Math.ceil(totalCount / itemsPerPage)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          news,
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
    console.error('News API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'お知らせデータの取得に失敗しました'
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
