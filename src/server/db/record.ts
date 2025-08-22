import type { Record } from '@prisma/client'
import BaseDB from './base'

class RecordDB extends BaseDB {
  // 管理画面用：記録一覧を取得（全ての記録）
  async getRecordsForAdmin(): Promise<Record[]> {
    try {
      const records = await BaseDB.prisma.record.findMany({
        orderBy: [
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
      return records
    } catch (err) {
      console.error(err)
      return []
    }
  }

  // 管理画面用：記録一覧を取得（全ての記録、ページネーション対応）
  async getRecordsForAdminWithPagination(
    page: number,
    itemsPerPage: number
  ): Promise<{
    records: Record[]
    totalCount: number
  }> {
    try {
      // 総件数を取得
      const totalCount = await BaseDB.prisma.record.count()

      // 記録データを取得
      const records = await BaseDB.prisma.record.findMany({
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
        orderBy: [
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

      return { records, totalCount }
    } catch (err) {
      console.error(err)
      return { records: [], totalCount: 0 }
    }
  }

  // フロント画面用：記録一覧を取得（公開済みのみ）
  async getRecordsForFrontend(): Promise<Record[]> {
    try {
      const records = await BaseDB.prisma.record.findMany({
        where: {
          status: 'published'
        },
        orderBy: [
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
      return records
    } catch (err) {
      console.error(err)
      return []
    }
  }

  // フロント画面用：記録一覧を取得（公開済みのみ、ページネーション対応）
  async getRecordsForFrontendWithPagination(
    page: number,
    itemsPerPage: number,
    category?: string
  ): Promise<{
    records: Record[]
    totalCount: number
  }> {
    try {
      // カテゴリーフィルターの条件を構築
      const whereCondition: any = {
        status: 'published'
      }

      if (category) {
        whereCondition.categories = {
          array_contains: [category]
        }
      }

      // 総件数を取得
      const totalCount = await BaseDB.prisma.record.count({
        where: whereCondition
      })

      // 記録データを取得
      const records = await BaseDB.prisma.record.findMany({
        where: whereCondition,
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
        orderBy: [
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

      return { records, totalCount }
    } catch (err) {
      console.error(err)
      return { records: [], totalCount: 0 }
    }
  }

  // 個別の記録を取得
  async getRecordById(id: number): Promise<Record | null> {
    try {
      const record = await BaseDB.prisma.record.findUnique({
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
      return record
    } catch (err) {
      console.error(err)
      return null
    }
  }

  // 公開済みの記録を取得（フロントエンド用）
  async getPublicRecordById(id: number): Promise<Record | null> {
    try {
      const record = await BaseDB.prisma.record.findFirst({
        where: {
          id,
          status: 'published'
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
      return record
    } catch (err) {
      console.error(err)
      return null
    }
  }

  // 記録を作成
  async createRecord(data: {
    location: string
    datetime: string
    eventDate: Date
    weather: string
    participants: string
    reporter: string
    content: string
    nearMiss?: string | null
    equipment?: string | null
    remarks?: string | null
    categories?: any[]
    images?: any[]
    status?: string
    creatorId: number
  }): Promise<Record | null> {
    try {
      const record = await BaseDB.prisma.record.create({
        data: {
          location: data.location,
          datetime: data.datetime,
          eventDate: data.eventDate,
          weather: data.weather,
          participants: data.participants,
          reporter: data.reporter,
          content: data.content,
          nearMiss: data.nearMiss || null,
          equipment: data.equipment || null,
          remarks: data.remarks || null,
          categories: data.categories || [],
          images: data.images || [],
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
      return record
    } catch (err) {
      console.error(err)
      return null
    }
  }

  // 記録を更新
  async updateRecord(
    id: number,
    data: {
      location?: string
      datetime?: string
      eventDate?: Date
      weather?: string
      participants?: string
      reporter?: string
      content?: string
      nearMiss?: string | null
      equipment?: string | null
      remarks?: string | null
      categories?: any[]
      images?: any[]
    }
  ): Promise<Record | null> {
    try {
      const record = await BaseDB.prisma.record.update({
        where: { id },
        data: {
          ...(data.location !== undefined && { location: data.location }),
          ...(data.datetime !== undefined && { datetime: data.datetime }),
          ...(data.eventDate !== undefined && { eventDate: data.eventDate }),
          ...(data.weather !== undefined && { weather: data.weather }),
          ...(data.participants !== undefined && { participants: data.participants }),
          ...(data.reporter !== undefined && { reporter: data.reporter }),
          ...(data.content !== undefined && { content: data.content }),
          ...(data.nearMiss !== undefined && { nearMiss: data.nearMiss }),
          ...(data.equipment !== undefined && { equipment: data.equipment }),
          ...(data.remarks !== undefined && { remarks: data.remarks }),
          ...(data.categories !== undefined && { categories: data.categories }),
          ...(data.images !== undefined && { images: data.images })
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
      return record
    } catch (err) {
      console.error(err)
      return null
    }
  }

  // 記録を削除
  async deleteRecord(id: number): Promise<boolean> {
    try {
      await BaseDB.prisma.record.delete({
        where: { id }
      })
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  // 作成者IDで記録を取得
  async getRecordsByCreatorId(creatorId: number): Promise<Record[]> {
    try {
      const records = await BaseDB.prisma.record.findMany({
        where: { creatorId },
        orderBy: [
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
      return records
    } catch (err) {
      console.error(err)
      return []
    }
  }

  // 日付範囲で記録を取得
  async getRecordsByDateRange(startDate: Date, endDate: Date): Promise<Record[]> {
    try {
      const records = await BaseDB.prisma.record.findMany({
        where: {
          eventDate: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: [
          {
            eventDate: 'desc'
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
      return records
    } catch (err) {
      console.error(err)
      return []
    }
  }
}

export default new RecordDB()
