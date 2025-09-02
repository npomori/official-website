import type { Article, ArticleDetailResponse, ArticleListResponse } from '@/types/article'

const API_BASE_URL = '/api'

export default class ArticleFetch {
  // 記事一覧を取得
  static async getArticles(
    page: number = 1,
    limit: number = 10,
    category?: string,
    tags?: string[]
  ): Promise<ArticleListResponse> {
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

    const response = await fetch(`${API_BASE_URL}/articles?${params}`)

    if (!response.ok) {
      throw new Error('記事一覧の取得に失敗しました')
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || '記事一覧の取得に失敗しました')
    }

    return result.data
  }

  // 記事詳細を取得（ID）
  static async getArticle(id: number): Promise<Article> {
    const response = await fetch(`${API_BASE_URL}/articles/${id}`)

    if (!response.ok) {
      throw new Error('記事詳細の取得に失敗しました')
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || '記事詳細の取得に失敗しました')
    }

    return result.data.article
  }

  // 記事詳細を取得（スラッグ）
  static async getArticleBySlug(slug: string): Promise<Article> {
    const response = await fetch(`${API_BASE_URL}/articles/slug/${slug}`)

    if (!response.ok) {
      throw new Error('記事詳細の取得に失敗しました')
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || '記事詳細の取得に失敗しました')
    }

    return result.data.article
  }

  // カテゴリー一覧を取得
  static async getCategories(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/articles/categories`)

    if (!response.ok) {
      throw new Error('カテゴリー一覧の取得に失敗しました')
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'カテゴリー一覧の取得に失敗しました')
    }

    return result.data.categories
  }

  // タグ一覧を取得
  static async getTags(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/articles/tags`)

    if (!response.ok) {
      throw new Error('タグ一覧の取得に失敗しました')
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'タグ一覧の取得に失敗しました')
    }

    return result.data.tags
  }

  // 人気記事を取得
  static async getPopularArticles(limit: number = 5): Promise<Article[]> {
    const response = await fetch(`${API_BASE_URL}/articles/popular?limit=${limit}`)

    if (!response.ok) {
      throw new Error('人気記事の取得に失敗しました')
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || '人気記事の取得に失敗しました')
    }

    return result.data.articles
  }

  // 最新記事を取得
  static async getLatestArticles(limit: number = 5): Promise<Article[]> {
    const response = await fetch(`${API_BASE_URL}/articles/latest?limit=${limit}`)

    if (!response.ok) {
      throw new Error('最新記事の取得に失敗しました')
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || '最新記事の取得に失敗しました')
    }

    return result.data.articles
  }
}
