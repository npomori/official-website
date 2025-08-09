import { getConfig } from '@/types/config'

interface News {
  id: number
  title: string
  content: string
  date: string
  categories?: string[] | null
  priority?: string | null
  attachments?: string[] | null
  author: string
  status: string
  creatorId: number
  createdAt: string
  updatedAt: string
  creator: {
    id: number
    name: string
    email: string
  }
}

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

const newsFetch = {
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

      const response = await fetch(`/api/news?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'お知らせの取得に失敗しました')
      }

      return data
    } catch (error) {
      console.error('News fetch error:', error)
      throw error
    }
  },

  // 個別のお知らせを取得
  async getNewsById(id: number): Promise<News> {
    try {
      const response = await fetch(`/api/news/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'お知らせの取得に失敗しました')
      }

      return data.data
    } catch (error) {
      console.error('News fetch error:', error)
      throw error
    }
  },

  // お知らせを作成
  async createNews(newsData: {
    title: string
    content: string
    date: string
    categories: string[]
    priority?: string | null
    attachments?: string[]
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

      const response = await fetch('/api/news', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'お知らせの作成に失敗しました')
      }

      return data.data
    } catch (error) {
      console.error('News creation error:', error)
      throw error
    }
  },

  // お知らせを更新
  async updateNews(
    id: number,
    newsData: {
      title: string
      content: string
      date: string
      categories: string[]
      priority?: string | null
      attachments?: string[]
    }
  ): Promise<News> {
    try {
      const response = await fetch(`/api/news/${id}`, {
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
      console.error('News update error:', error)
      throw error
    }
  },

  // お知らせを削除
  async deleteNews(id: number): Promise<void> {
    try {
      const response = await fetch(`/api/news/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'お知らせの削除に失敗しました')
      }
    } catch (error) {
      console.error('News deletion error:', error)
      throw error
    }
  },

  // 最新のお知らせを取得
  async getLatestNews(limit: number = 5): Promise<News[]> {
    try {
      const response = await fetch(`/api/news?limit=${limit}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '最新のお知らせの取得に失敗しました')
      }

      return data.data.news
    } catch (error) {
      console.error('Latest news fetch error:', error)
      return []
    }
  }
}

export default newsFetch
