import type { Article } from '@/types/article'
import { getConfig } from '@/types/config'
import { BaseApiFetch } from '../base'

interface ArticleResponse {
  articles: Article[]
  pagination: {
    currentPage: number
    itemsPerPage: number
    totalCount: number
    totalPages: number
  }
}

class AdminArticleFetch extends BaseApiFetch {
  // 管理者用の記事一覧を取得
  async getArticles(page: number = 1, limit?: number, category?: string, tags?: string[]) {
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

    if (tags && tags.length > 0) {
      params.append('tags', tags.join(','))
    }

    const response = await this.request<ArticleResponse>(
      `${config.api.adminUrl}/articles?${params.toString()}`
    )
    return response
  }

  // 記事の詳細を取得
  async getArticle(id: number | string) {
    const config = getConfig()
    const response = await this.request<Article>(`${config.api.adminUrl}/articles/${id}`)
    return response
  }

  // 記事を削除
  async deleteArticle(id: number) {
    const config = getConfig()
    const response = await this.request(`${config.api.adminUrl}/articles/${id}`, {
      method: 'DELETE'
    })
    return response
  }

  // 記事を更新
  async updateArticle(id: number, data: FormData) {
    const config = getConfig()
    const response = await this.request(`${config.api.adminUrl}/articles/${id}`, {
      method: 'PUT',
      body: data
    })
    return response
  }

  // 記事を作成
  async createArticle(data: FormData) {
    const config = getConfig()
    const response = await this.request(`${config.api.adminUrl}/articles`, {
      method: 'POST',
      body: data
    })
    return response
  }
}

const adminArticleFetch = new AdminArticleFetch()
export default adminArticleFetch
