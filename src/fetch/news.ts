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
