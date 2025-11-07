import { RecordDB } from '@/server/db'
import { getConfig } from '@/types/config'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = url.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category') || undefined

    // 設定からデフォルト値を取得
    const config = getConfig()
    const defaultLimit = config.pagination?.recordList?.itemsPerPage || 10
    const itemsPerPage = limit > 0 ? limit : defaultLimit

    // RecordDBを使用してフロントエンド用の記録を取得（ページネーション対応）
    const { records, totalCount } = await RecordDB.getRecordsForFrontendWithPagination(
      page,
      itemsPerPage,
      category
    )

    // ページネーション情報を計算
    const totalPages = Math.ceil(totalCount / itemsPerPage)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          records,
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
    console.error('Record API Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: '記録データの取得に失敗しました'
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
