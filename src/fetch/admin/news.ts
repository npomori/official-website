import config from '@/config/config.json'
import { getConfig } from '@/types/config'
import type { News, NewsAttachment } from '@/types/news'
import { BaseApiFetch } from '../base'

interface NewsResponse {
  news: News[]
  pagination: {
    currentPage: number
    itemsPerPage: number
    totalCount: number
    totalPages: number
  }
}

class AdminNewsFetch extends BaseApiFetch {
  // 管理者用のお知らせ一覧を取得
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
      `${config.api.adminUrl}/news?${params.toString()}`
    )
    return response
  }

  // フロントエンドで表示されない項目（非公開・未来の日付）を取得
  async getHiddenNews(page: number = 1, limit?: number) {
    const config = getConfig()
    const defaultLimit = config.pagination?.newsList?.itemsPerPage || 10
    const itemsPerPage = limit || defaultLimit

    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString(),
      hidden: 'true' // 非公開・未来の日付の項目のみを取得
    })

    const response = await this.request<NewsResponse>(
      `${config.api.adminUrl}/news?${params.toString()}`
    )
    return response
  }

  // 管理者用の個別のお知らせを取得
  async getNewsById(id: number) {
    return await this.request<News>(`${config.api.adminUrl}/news/${id}`)
  }

  // 管理者用のお知らせを作成（ファイルアップロード対応）
  async createNewsWithFiles(formData: FormData) {
    const config = getConfig()
    const response = await this.requestWithFormData<News>(
      `${config.api.adminUrl}/news`,
      formData,
      'POST'
    )
    return response
  }

  // 管理者用のお知らせを作成（従来の方法）
  /*async createNews(newsData: {
    title: string
    content: string
    date: string
    categories: string[]
    priority?: string | null
    isMemberOnly?: boolean
    author: string
    attachments?: NewsAttachment[]
  }) {
    const formData = new FormData()
    formData.append('title', newsData.title)
    formData.append('content', newsData.content)
    formData.append('date', newsData.date)
    formData.append('categories', JSON.stringify(newsData.categories))
    formData.append('author', newsData.author)
    if (newsData.priority) {
      formData.append('priority', newsData.priority)
    }
    if (newsData.isMemberOnly !== undefined) {
      formData.append('isMemberOnly', newsData.isMemberOnly.toString())
    }
    if (newsData.attachments) {
      formData.append('attachments', JSON.stringify(newsData.attachments))
    }

    const config = getConfig()
    const response = await this.requestWithFormData<News>(
      `${config.api.adminUrl}/news`,
      formData,
      'POST'
    )
    return response
  }*/

  // 管理者用のお知らせを更新
  /*
  async updateNews(
    id: number,
    newsData: {
      title: string
      content: string
      date: string
      categories: string[]
      priority?: string | null
      isMemberOnly?: boolean
      author: string
      attachments?: NewsAttachment[]
    }
  ) {
    const config = getConfig()
    const response = await this.requestWithJson<News>(
      `${config.api.adminUrl}/news/${id}`,
      newsData,
      'PUT'
    )
    return response
  }*/

  // 管理者用のお知らせを更新（ファイルアップロード対応）
  async updateNewsWithFiles(id: number, formData: FormData) {
    const config = getConfig()
    const response = await this.requestWithFormData<News>(
      `${config.api.adminUrl}/news/${id}`,
      formData,
      'PUT'
    )
    return response
  }

  // 管理者用のお知らせを削除
  async deleteNews(id: number) {
    const config = getConfig()
    const response = await this.request<void>(`${config.api.adminUrl}/news/${id}`, {
      method: 'DELETE'
    })
    return response
  }
}

export default new AdminNewsFetch()
