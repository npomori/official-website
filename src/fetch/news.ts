import config from '@/config/config.json'
import { getConfig } from '@/types/config'
import type { PublicNews } from '@/types/news'
import { BaseApiFetch } from './base'

interface NewsResponse {
  news: PublicNews[]
  pagination: {
    currentPage: number
    itemsPerPage: number
    totalCount: number
    totalPages: number
  }
}

class NewsFetch extends BaseApiFetch {
  // お知らせ一覧を取得
  async getNews(page: number = 1, limit?: number, category?: string, priority?: string) {
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

    const response = await this.request<NewsResponse>(
      `${config.api.rootUrl}/news?${params.toString()}`
    )
    return response
  }

  // 個別のお知らせを取得
  async getNewsById(id: number) {
    return await this.request<PublicNews>(`${config.api.rootUrl}/news/${id}`)
  }

  // 最新のお知らせを取得
  async getLatestNews(limit: number = 5) {
    return await this.request<{ news: PublicNews[] }>(`${config.api.rootUrl}/news?limit=${limit}`)
  }
}

export default new NewsFetch()
