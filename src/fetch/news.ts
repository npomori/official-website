import config from '@/config/config.json'
import { getConfig } from '@/types/config'
import type { News } from '@/types/news'

interface NewsResponse {
  success: boolean
  data: {
    news: News[]
    pagination: {
      currentPage: number
      itemsPerPage: number
      totalCount: number
      totalPages: number
      hasNextPage: boolean
      hasPrevPage: boolean
    }
  }
  error?: string
}

class NewsFetch {
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

      const response = await fetch(`${config.api.rootUrl}/news?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'お知らせの取得に失敗しました')
      }

      return data
    } catch (error) {
      console.error('News fetch error:', error)
      throw error
    }
  }

  // 個別のお知らせを取得
  async getNewsById(id: number): Promise<News> {
    try {
      const response = await fetch(`${config.api.rootUrl}/news/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'お知らせの取得に失敗しました')
      }

      return data.data
    } catch (error) {
      console.error('News fetch error:', error)
      throw error
    }
  }

  // 最新のお知らせを取得
  async getLatestNews(limit: number = 5): Promise<News[]> {
    try {
      const response = await fetch(`${config.api.rootUrl}/news?limit=${limit}`)
      const data = await response.json()

      if (!response.ok) {
        const errorMessage =
          typeof data?.error === 'string' ? data.error : '最新のお知らせの取得に失敗しました'
        throw new Error(String(errorMessage))
      }

      return data.data.news
    } catch (error) {
      console.error('Latest news fetch error:', error)
      return []
    }
  }
}

export default new NewsFetch()
