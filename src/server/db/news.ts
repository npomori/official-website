import BaseDB from './base'

interface News {
  id: number
  title: string
  content: string
  date: Date
  categories?: string[] | null
  priority?: string | null
  attachments?: string[] | null
  author: string
  status: string
  creatorId: number
  createdAt: Date
  updatedAt: Date
  creator: {
    id: number
    name: string
    email: string
  }
}

interface CreateNewsData {
  title: string
  content: string
  date: Date
  categories?: string[]
  priority?: string
  attachments?: string[]
  author: string
  status?: string
  creatorId: number
}

interface UpdateNewsData {
  title?: string
  content?: string
  date?: Date
  categories?: string[]
  priority?: string
  attachments?: string[]
  author?: string
  status?: string
}

class NewsDB extends BaseDB {
  // 管理画面用：お知らせ一覧を取得（ページネーション対応）
  async getNewsForAdminWithPagination(
    page: number,
    itemsPerPage: number
  ): Promise<{
    news: News[]
    totalCount: number
  }> {
    try {
      // 総件数を取得
      const totalCount = await BaseDB.prisma.news.count()

      // お知らせデータを取得
      const news = await BaseDB.prisma.news.findMany({
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
        orderBy: [
          {
            date: 'desc'
          }
        ],
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      return { news, totalCount }
    } catch (err) {
      console.error(err)
      return { news: [], totalCount: 0 }
    }
  }

  // フロント画面用：お知らせ一覧を取得（公開済みのみ、ページネーション対応）
  async getNewsForFrontendWithPagination(
    page: number,
    itemsPerPage: number,
    category?: string,
    priority?: string
  ): Promise<{
    news: News[]
    totalCount: number
  }> {
    try {
      // まず全ての公開済みお知らせを取得
      const allNews = await BaseDB.prisma.news.findMany({
        where: {
          status: 'published'
        },
        orderBy: [
          {
            date: 'desc'
          }
        ],
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // カテゴリーフィルターを適用
      let filteredNews = allNews
      if (category) {
        filteredNews = filteredNews.filter((item) => {
          if (!item.categories || !Array.isArray(item.categories)) return false
          return item.categories.includes(category)
        })
      }

      // 優先度フィルターを適用
      if (priority) {
        filteredNews = filteredNews.filter((item) => {
          return item.priority === priority
        })
      }

      // 総件数を取得
      const totalCount = filteredNews.length

      // ページネーションを適用
      const startIndex = (page - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedNews = filteredNews.slice(startIndex, endIndex)

      return { news: paginatedNews, totalCount }
    } catch (err) {
      console.error(err)
      return { news: [], totalCount: 0 }
    }
  }

  // お知らせを作成
  async createNews(data: CreateNewsData): Promise<News> {
    return await BaseDB.prisma.news.create({
      data: {
        title: data.title,
        content: data.content,
        date: data.date,
        categories: data.categories || [],
        priority: data.priority || null,
        attachments: data.attachments || [],
        author: data.author,
        status: data.status || 'published',
        creatorId: data.creatorId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  }

  // お知らせを更新
  async updateNews(id: number, data: UpdateNewsData): Promise<News | null> {
    try {
      return await BaseDB.prisma.news.update({
        where: { id },
        data: {
          title: data.title,
          content: data.content,
          date: data.date,
          categories: data.categories,
          priority: data.priority,
          attachments: data.attachments,
          author: data.author,
          status: data.status
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
    } catch (err) {
      console.error(err)
      return null
    }
  }

  // お知らせを削除
  async deleteNews(id: number): Promise<boolean> {
    try {
      await BaseDB.prisma.news.delete({
        where: { id }
      })
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  // お知らせを取得（ID指定）
  async getNewsById(id: number): Promise<News | null> {
    try {
      return await BaseDB.prisma.news.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
    } catch (err) {
      console.error(err)
      return null
    }
  }

  // 最新のお知らせを取得（フロントエンド用）
  async getLatestNews(limit: number = 5): Promise<News[]> {
    try {
      return await BaseDB.prisma.news.findMany({
        where: {
          status: 'published'
        },
        take: limit,
        orderBy: [
          {
            date: 'desc'
          }
        ],
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })
    } catch (err) {
      console.error(err)
      return []
    }
  }
}

export default NewsDB
