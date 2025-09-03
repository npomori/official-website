import type { ApiResponse } from '@/types/api'
import type { Article, ArticleDetailResponse, ArticleListResponse } from '@/types/article'
import { getConfig } from '@/types/config'
import { BaseApiFetch } from './base'

const config = getConfig()

export default class ArticleFetch extends BaseApiFetch {
  // 記事一覧を取得
  static async getArticles(
    page: number = 1,
    limit: number = 10,
    category?: string,
    tags?: string[]
  ): Promise<ApiResponse<ArticleListResponse>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    })

    if (category) {
      params.append('category', category)
    }

    if (tags && tags.length > 0) {
      params.append('tags', tags.join(','))
    }

    return await this.prototype.request<ArticleListResponse>(
      `${config.api.rootUrl}/article?${params}`
    )
  }

  // 記事詳細を取得（ID）
  static async getArticle(id: number): Promise<ApiResponse<{ article: Article }>> {
    return await this.prototype.request<{ article: Article }>(`${config.api.rootUrl}/article/${id}`)
  }

  // カテゴリー一覧を取得
  static async getCategories(): Promise<ApiResponse<{ categories: string[] }>> {
    return await this.prototype.request<{ categories: string[] }>(
      `${config.api.rootUrl}/article/categories`
    )
  }

  // タグ一覧を取得
  static async getTags(): Promise<ApiResponse<{ tags: string[] }>> {
    return await this.prototype.request<{ tags: string[] }>(`${config.api.rootUrl}/article/tags`)
  }

  // 人気記事を取得
  static async getPopularArticles(
    limit: number = 5
  ): Promise<ApiResponse<{ articles: Article[] }>> {
    return await this.prototype.request<{ articles: Article[] }>(
      `${config.api.rootUrl}/article/popular?limit=${limit}`
    )
  }

  // 最新記事を取得
  static async getLatestArticles(limit: number = 5): Promise<ApiResponse<{ articles: Article[] }>> {
    return await this.prototype.request<{ articles: Article[] }>(
      `${config.api.rootUrl}/article/latest?limit=${limit}`
    )
  }
}
