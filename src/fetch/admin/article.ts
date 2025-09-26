import type { Article, CreateArticleData, UpdateArticleData } from '@/types/article'
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
  // 画像アップロード（記事関連で使用）
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    // 新しい管理用アップロードエンドポイント
    const res = await this.requestWithFormData<{ url: string }>(
      `/api/admin/article/upload`,
      formData,
      'POST'
    )
    if (!res.success || !res.data?.url) {
      throw new Error(res.message || '画像アップロードに失敗しました')
    }
    return { url: res.data.url }
  }
  // 一時アップロード削除 (未使用の画像をクリーンアップ)
  async deleteUploadedImage(url: string): Promise<boolean> {
    try {
      const endpoint = `/api/admin/article/upload?url=${encodeURIComponent(url)}`
      const res = await fetch(endpoint, { method: 'DELETE' })
      if (!res.ok) return false
      return true
    } catch {
      return false
    }
  }
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
      `${config.api.adminUrl}/article?${params.toString()}`
    )
    return response
  }

  // 記事の詳細を取得
  async getArticle(id: number | string) {
    const config = getConfig()
    const response = await this.request<Article>(`${config.api.adminUrl}/article/${id}`)
    return response
  }

  // 記事を削除
  async deleteArticle(id: number) {
    const config = getConfig()
    const response = await this.request(`${config.api.adminUrl}/article/${id}`, {
      method: 'DELETE'
    })
    return response
  }

  // 記事を更新（JSON）
  /*async updateArticle(id: number, data: UpdateArticleData & { content: string }) {
    const config = getConfig()
    const response = await this.requestWithJson(`${config.api.adminUrl}/article/${id}`, data, 'PUT')
    return response
  }*/

  // 記事を作成（JSON）
  /*async createArticle(data: CreateArticleData) {
    const config = getConfig()
    const response = await this.requestWithJson(`${config.api.adminUrl}/article`, data, 'POST')
    return response
  }*/
}

export default new AdminArticleFetch()
