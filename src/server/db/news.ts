import type { CreateNewsData, News, NewsAttachment, UpdateNewsData } from '@/types/news'
import type { Prisma } from '@prisma/client'
import BaseDB from './base'

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
          },
          {
            id: 'desc'
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

      // データベースから取得したデータを正しい型に変換（オブジェクト形式のみ）
      const convertedNews = news.map((item) => {
        const attachments: NewsAttachment[] | null = Array.isArray(item.attachments)
          ? (item.attachments as unknown[])
              .filter(
                (att) =>
                  typeof att === 'object' &&
                  att !== null &&
                  'originalName' in (att as any) &&
                  'filename' in (att as any)
              )
              .map((att) => ({
                originalName: String((att as any).originalName),
                filename: String((att as any).filename)
              }))
          : null
        const categories: string[] | null = Array.isArray(item.categories)
          ? (item.categories as unknown[]).map((v) => String(v))
          : null
        return {
          ...item,
          attachments,
          categories
        } as unknown as News
      })

      return { news: convertedNews, totalCount }
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
      // 今日の日付を取得（日本時間）
      const today = new Date()
      today.setHours(23, 59, 59, 999) // 今日の23:59:59まで

      // まず全ての公開済みお知らせを取得（本日以前の日付のみ）
      const allNews = await BaseDB.prisma.news.findMany({
        where: {
          status: 'published',
          date: {
            lte: today
          }
        },
        orderBy: [
          {
            date: 'desc'
          },
          {
            id: 'desc'
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

      // データベースから取得したデータを正しい型に変換（オブジェクト形式のみ）
      const convertedNews = paginatedNews.map((item) => {
        const attachments: NewsAttachment[] | null = Array.isArray(item.attachments)
          ? (item.attachments as unknown[])
              .filter(
                (att) =>
                  typeof att === 'object' &&
                  att !== null &&
                  'originalName' in (att as any) &&
                  'filename' in (att as any)
              )
              .map((att) => ({
                originalName: String((att as any).originalName),
                filename: String((att as any).filename)
              }))
          : null
        const categories: string[] | null = Array.isArray(item.categories)
          ? (item.categories as unknown[]).map((v) => String(v))
          : null
        return {
          ...item,
          attachments,
          categories
        } as unknown as News
      })

      return { news: convertedNews, totalCount }
    } catch (err) {
      console.error(err)
      return { news: [], totalCount: 0 }
    }
  }

  // お知らせを作成
  async createNews(data: CreateNewsData): Promise<News> {
    const created = await BaseDB.prisma.news.create({
      data: {
        title: data.title,
        content: data.content,
        date: data.date,
        categories: (data.categories ?? []) as unknown as Prisma.InputJsonValue,
        priority: data.priority ?? null,
        attachments: (data.attachments ?? []) as unknown as Prisma.InputJsonValue,
        author: data.author,
        status: data.status ?? 'published',
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

    const attachments: NewsAttachment[] | null = Array.isArray(created.attachments)
      ? (created.attachments as unknown[])
          .filter(
            (att) =>
              typeof att === 'object' &&
              att !== null &&
              'originalName' in (att as any) &&
              'filename' in (att as any)
          )
          .map((att) => ({
            originalName: String((att as any).originalName),
            filename: String((att as any).filename)
          }))
      : null
    const categories: string[] | null = Array.isArray(created.categories)
      ? (created.categories as unknown[]).map((v) => String(v))
      : null

    return { ...(created as any), attachments, categories } as News
  }

  // お知らせを更新
  async updateNews(id: number, data: UpdateNewsData): Promise<News | null> {
    try {
      const updated = await BaseDB.prisma.news.update({
        where: { id },
        data: {
          title: data.title,
          content: data.content,
          date: data.date,
          categories: (data.categories ?? null) as unknown as Prisma.InputJsonValue,
          priority: data.priority,
          attachments: (data.attachments ?? null) as unknown as Prisma.InputJsonValue,
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

      const attachments: NewsAttachment[] | null = Array.isArray(updated.attachments)
        ? (updated.attachments as unknown[])
            .filter(
              (att) =>
                typeof att === 'object' &&
                att !== null &&
                'originalName' in (att as any) &&
                'filename' in (att as any)
            )
            .map((att) => ({
              originalName: String((att as any).originalName),
              filename: String((att as any).filename)
            }))
        : null
      const categories: string[] | null = Array.isArray(updated.categories)
        ? (updated.categories as unknown[]).map((v) => String(v))
        : null

      return { ...(updated as any), attachments, categories } as News
    } catch (err) {
      console.error(err)
      return null
    }
  }

  // お知らせを削除
  async deleteNews(id: number): Promise<boolean> {
    try {
      // お知らせを取得して添付ファイル情報を取得
      const news = await BaseDB.prisma.news.findUnique({
        where: { id },
        select: { attachments: true }
      })

      // お知らせを削除
      await BaseDB.prisma.news.delete({
        where: { id }
      })

      // 添付ファイルがあれば削除
      if (news?.attachments && Array.isArray(news.attachments)) {
        const { newsFileUploader } = await import('@/server/utils/file-upload')
        const filenames: string[] = []
        for (const att of news.attachments) {
          if (
            att &&
            typeof att === 'object' &&
            'filename' in att &&
            typeof att.filename === 'string'
          ) {
            filenames.push(att.filename)
          }
        }
        await newsFileUploader.deleteFiles(filenames)
      }

      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  // お知らせを取得（ID指定）
  async getNewsById(id: number): Promise<News | null> {
    try {
      const news = await BaseDB.prisma.news.findUnique({
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

      if (!news) return null

      // データベースから取得したデータを正しい型に変換（オブジェクト形式のみ）
      const convertedAttachments: NewsAttachment[] | null = Array.isArray(news.attachments)
        ? (news.attachments as unknown[])
            .filter(
              (att) =>
                typeof att === 'object' &&
                att !== null &&
                'originalName' in (att as any) &&
                'filename' in (att as any)
            )
            .map((att) => ({
              originalName: String((att as any).originalName),
              filename: String((att as any).filename)
            }))
        : null
      const categories: string[] | null = Array.isArray(news.categories)
        ? (news.categories as unknown[]).map((v) => String(v))
        : null

      return {
        ...(news as any),
        attachments: convertedAttachments,
        categories
      } as News
    } catch (err) {
      console.error(err)
      return null
    }
  }

  // 最新のお知らせを取得（フロントエンド用）
  async getLatestNews(limit: number = 5): Promise<News[]> {
    try {
      // 今日の日付を取得（日本時間）
      const today = new Date()
      today.setHours(23, 59, 59, 999) // 今日の23:59:59まで

      const news = await BaseDB.prisma.news.findMany({
        where: {
          status: 'published',
          date: {
            lte: today
          }
        },
        take: limit,
        orderBy: [
          {
            date: 'desc'
          },
          {
            id: 'desc'
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

      // データベースから取得したデータを正しい型に変換（オブジェクト形式のみ）
      return news.map((item) => {
        const attachments: NewsAttachment[] | null = Array.isArray(item.attachments)
          ? (item.attachments as unknown[])
              .filter(
                (att) =>
                  typeof att === 'object' &&
                  att !== null &&
                  'originalName' in (att as any) &&
                  'filename' in (att as any)
              )
              .map((att) => ({
                originalName: String((att as any).originalName),
                filename: String((att as any).filename)
              }))
          : null
        const categories: string[] | null = Array.isArray(item.categories)
          ? (item.categories as unknown[]).map((v) => String(v))
          : null
        return { ...(item as any), attachments, categories } as News
      })
    } catch (err) {
      console.error(err)
      return []
    }
  }

  // ファイル名から添付ファイル情報を取得
  async getAttachmentByFilename(filename: string): Promise<NewsAttachment | null> {
    try {
      const news = await BaseDB.prisma.news.findMany({
        select: { attachments: true }
      })

      for (const item of news) {
        if (item.attachments && Array.isArray(item.attachments)) {
          const attachment = item.attachments.find((att: unknown) => {
            if (typeof att === 'object' && att !== null && 'filename' in att) {
              return (att as { filename: string }).filename === filename
            }
            return false
          })
          if (attachment && typeof attachment === 'object' && attachment !== null) {
            const typedAttachment = attachment as { originalName?: string; filename?: string }
            if (typedAttachment.originalName && typedAttachment.filename) {
              return {
                originalName: typedAttachment.originalName,
                filename: typedAttachment.filename
              } as NewsAttachment
            }
          }
        }
      }

      return null
    } catch (err) {
      console.error(err)
      return null
    }
  }

  // ダウンロード回数を記録
  async recordDownload(newsId: number, filename: string): Promise<boolean> {
    try {
      // 現在のお知らせを取得
      const news = await BaseDB.prisma.news.findUnique({
        where: { id: newsId },
        select: { downloadStats: true }
      })

      if (!news) return false

      // 現在のダウンロード統計を取得または初期化
      const currentStats = (news.downloadStats as any) || {}

      // ファイルのダウンロード回数を増加
      if (currentStats[filename]) {
        currentStats[filename].count = (currentStats[filename].count || 0) + 1
        currentStats[filename].lastDownloadAt = new Date().toISOString()
      } else {
        currentStats[filename] = {
          count: 1,
          firstDownloadAt: new Date().toISOString(),
          lastDownloadAt: new Date().toISOString()
        }
      }

      // データベースを更新
      await BaseDB.prisma.news.update({
        where: { id: newsId },
        data: {
          downloadStats: currentStats as unknown as Prisma.InputJsonValue
        }
      })

      return true
    } catch (err) {
      console.error('ダウンロード記録の保存に失敗:', err)
      return false
    }
  }

  // ファイルのダウンロード回数を取得
  async getDownloadCount(
    newsId: number,
    filename?: string
  ): Promise<number | Record<string, number>> {
    try {
      const news = await BaseDB.prisma.news.findUnique({
        where: { id: newsId },
        select: { downloadStats: true }
      })

      if (!news || !news.downloadStats) {
        return filename ? 0 : {}
      }

      const stats = news.downloadStats as any

      if (filename) {
        // 特定ファイルのダウンロード回数を返す
        return stats[filename]?.count || 0
      } else {
        // 全ファイルのダウンロード回数を返す
        const result: Record<string, number> = {}
        for (const [file, data] of Object.entries(stats)) {
          result[file] = (data as any)?.count || 0
        }
        return result
      }
    } catch (err) {
      console.error('ダウンロード回数の取得に失敗:', err)
      return filename ? 0 : {}
    }
  }

  // お知らせの詳細なダウンロード統計を取得
  async getDetailedDownloadStats(newsId: number): Promise<{
    [filename: string]: {
      count: number
      firstDownloadAt?: string
      lastDownloadAt?: string
    }
  }> {
    try {
      const news = await BaseDB.prisma.news.findUnique({
        where: { id: newsId },
        select: { downloadStats: true }
      })

      if (!news || !news.downloadStats) {
        return {}
      }

      return news.downloadStats as any
    } catch (err) {
      console.error('詳細ダウンロード統計の取得に失敗:', err)
      return {}
    }
  }

  // ダウンロード統計をリセット
  async resetDownloadStats(newsId: number, filename?: string): Promise<boolean> {
    try {
      if (filename) {
        // 特定ファイルの統計をリセット
        const news = await BaseDB.prisma.news.findUnique({
          where: { id: newsId },
          select: { downloadStats: true }
        })

        if (!news) return false

        const currentStats = (news.downloadStats as any) || {}
        delete currentStats[filename]

        await BaseDB.prisma.news.update({
          where: { id: newsId },
          data: {
            downloadStats: currentStats as unknown as Prisma.InputJsonValue
          }
        })
      } else {
        // 全ての統計をリセット
        await BaseDB.prisma.news.update({
          where: { id: newsId },
          data: {
            downloadStats: null
          }
        })
      }

      return true
    } catch (err) {
      console.error('ダウンロード統計のリセットに失敗:', err)
      return false
    }
  }

  // 管理画面用：ダウンロード統計付きのお知らせ一覧を取得
  async getNewsForAdminWithDownloadStats(
    page: number,
    itemsPerPage: number
  ): Promise<{
    news: (News & { totalDownloads: number })[]
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
          },
          {
            id: 'desc'
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

      // データベースから取得したデータを正しい型に変換し、ダウンロード統計を追加
      const convertedNews = news.map((item) => {
        const attachments: NewsAttachment[] | null = Array.isArray(item.attachments)
          ? (item.attachments as unknown[])
              .filter(
                (att) =>
                  typeof att === 'object' &&
                  att !== null &&
                  'originalName' in (att as any) &&
                  'filename' in (att as any)
              )
              .map((att) => ({
                originalName: String((att as any).originalName),
                filename: String((att as any).filename)
              }))
          : null
        const categories: string[] | null = Array.isArray(item.categories)
          ? (item.categories as unknown[]).map((v) => String(v))
          : null

        // 総ダウンロード数を計算
        const downloadStats = (item.downloadStats as any) || {}
        const totalDownloads = Object.values(downloadStats).reduce(
          (total: number, stat: any) => total + (stat?.count || 0),
          0
        )

        return {
          ...item,
          attachments,
          categories,
          totalDownloads
        } as unknown as News & { totalDownloads: number }
      })

      return { news: convertedNews, totalCount }
    } catch (err) {
      console.error(err)
      return { news: [], totalCount: 0 }
    }
  }
}

export default new NewsDB()
