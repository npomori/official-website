import { getConfig } from '@/types/config'
import type { News, NewsAttachment } from '@/types/news'

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

class AdminNewsFetch {
  // 管理者用のお知らせ一覧を取得
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

      const response = await fetch(`/api/admin/news?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'お知らせの取得に失敗しました')
      }

      return data
    } catch (error) {
      console.error('Admin news fetch error:', error)
      throw error
    }
  }

  // 管理者用の個別のお知らせを取得
  async getNewsById(id: number): Promise<News> {
    try {
      const response = await fetch(`/api/admin/news/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'お知らせの取得に失敗しました')
      }

      return data.data
    } catch (error) {
      console.error('Admin news fetch error:', error)
      throw error
    }
  }

  // 管理者用のお知らせを作成（ファイルアップロード対応）
  async createNewsWithFiles(formData: FormData): Promise<News> {
    try {
      const response = await fetch('/api/admin/news', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'お知らせの作成に失敗しました')
      }

      return data.data
    } catch (error) {
      console.error('Admin news creation error:', error)
      throw error
    }
  }

  // 管理者用のお知らせを作成（従来の方法）
  async createNews(newsData: {
    title: string
    content: string
    date: string
    categories: string[]
    priority?: string | null
    attachments?: NewsAttachment[]
  }): Promise<News> {
    try {
      const formData = new FormData()
      formData.append('title', newsData.title)
      formData.append('content', newsData.content)
      formData.append('date', newsData.date)
      formData.append('categories', JSON.stringify(newsData.categories))
      if (newsData.priority) {
        formData.append('priority', newsData.priority)
      }
      if (newsData.attachments) {
        formData.append('attachments', JSON.stringify(newsData.attachments))
      }

      const response = await fetch('/api/admin/news', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'お知らせの作成に失敗しました')
      }

      return data.data
    } catch (error) {
      console.error('Admin news creation error:', error)
      throw error
    }
  }

  // 管理者用のお知らせを更新
  async updateNews(
    id: number,
    newsData: {
      title: string
      content: string
      date: string
      categories: string[]
      priority?: string | null
      attachments?: NewsAttachment[]
    }
  ): Promise<News> {
    try {
      const response = await fetch(`/api/admin/news/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newsData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'お知らせの更新に失敗しました')
      }

      return data.data
    } catch (error) {
      console.error('Admin news update error:', error)
      throw error
    }
  }

  // 管理者用のお知らせを削除
  async deleteNews(id: number): Promise<void> {
    try {
      const response = await fetch(`/api/admin/news/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'お知らせの削除に失敗しました')
      }
    } catch (error) {
      console.error('Admin news deletion error:', error)
      throw error
    }
  }
}

export default new AdminNewsFetch()
