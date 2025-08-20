import config from '@/config/config.json'
import { getConfig } from '@/types/config'
import type { PublicNews } from '@/types/news'
import { BaseApiFetch } from './base'

interface NewsResponse {
  success: boolean
  data: {
    news: PublicNews[]
    pagination: {
      currentPage: number
      itemsPerPage: number
      totalCount: number
      totalPages: number
    }
  }
  error?: string
}

class NewsFetch extends BaseApiFetch {
  // お知らせ一覧を取得
  async getNews(
    page: number = 1,
    limit?: number,
    category?: string,
    priority?: string
  ): Promise<NewsResponse> {
    try {
      const config = getConfig()
      const defaultLimit = config.pagination?.newsList?.itemsPerPage || 10
      const itemsPerPage = limit || defaultLimit

      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      })

      if (category) {
        params.append('category', category)
      }

      if (priority) {
        params.append('priority', priority)
      }

      const response = await this.request<NewsResponse['data']>(
        `${config.api.rootUrl}/news?${params.toString()}`
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || 'お知らせの取得に失敗しました')
      }

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('News fetch error:', error)
      throw error
    }
  }

  // 個別のお知らせを取得
  async getNewsById(id: number): Promise<PublicNews> {
    try {
      const response = await this.request<PublicNews>(`${config.api.rootUrl}/news/${id}`)

      if (!response.success || !response.data) {
        throw new Error(response.message || 'お知らせの取得に失敗しました')
      }

      return response.data
    } catch (error) {
      console.error('News fetch error:', error)
      throw error
    }
  }

  // 最新のお知らせを取得
  async getLatestNews(limit: number = 5): Promise<PublicNews[]> {
    try {
      const response = await this.request<{ news: PublicNews[] }>(
        `${config.api.rootUrl}/news?limit=${limit}`
      )

      if (!response.success || !response.data) {
        throw new Error(response.message || '最新のお知らせの取得に失敗しました')
      }

      return response.data.news
    } catch (error) {
      console.error('Latest news fetch error:', error)
      return []
    }
  }
}

export default new NewsFetch()
