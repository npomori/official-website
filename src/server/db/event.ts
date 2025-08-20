import { Activity } from '@/server/utils/activity'
import type { Event } from '@prisma/client'
import BaseDB from './base'

interface AddEventData {
  title: string
  start: Date
  end: Date
  isAllDay: boolean
  categoryId: string
  description: string | null
  url: string | null
  creatorId: number
}
interface UpdateEventData {
  title: string
  start: Date
  end: Date
  isAllDay: boolean
  categoryId: string
  description: string | null
  url: string | null
}

interface PublicEvent {
  id: number
  title: string
  start: Date
  end: Date
  isAllDay: boolean
  categoryId: string
  commentCount: number
}

class EventDB extends BaseDB {
  async getEventById(id: number): Promise<Event | null> {
    try {
      const event = await BaseDB.prisma.event.findUnique({
        where: { id }
      })
      return event
    } catch (err) {
      console.error(err)
      return null
    }
  }

  async getEvents(): Promise<Event[]> {
    try {
      const events = await BaseDB.prisma.event.findMany({
        orderBy: [
          {
            start: 'asc'
          }
        ]
      })
      return events
    } catch (err) {
      console.error(err)
      return []
    }
  }
  /**
   * イベント取得(公開用)
   * @param startDate - 取得するイベントの開始日
   * @param endDate - 取得するイベントの終了日
   */
  async getPublicEvents(startDate: Date, endDate: Date): Promise<PublicEvent[]> {
    try {
      const events = await BaseDB.prisma.event.findMany({
        select: {
          id: true,
          title: true,
          start: true,
          end: true,
          isAllDay: true,
          categoryId: true,
          _count: {
            select: {
              Comments: true
            }
          }
        },
        where: {
          OR: [
            {
              start: {
                gte: startDate,
                lt: endDate
              }
            },
            {
              end: {
                gt: startDate,
                lte: endDate
              }
            },
            {
              AND: [
                {
                  start: {
                    lt: startDate
                  }
                },
                {
                  end: {
                    gt: endDate
                  }
                }
              ]
            }
          ]
        },
        orderBy: [
          {
            start: 'asc'
          }
        ]
      })
      return events.map((event: any) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        isAllDay: event.isAllDay,
        categoryId: event.categoryId,
        commentCount: event._count.Comments
      }))
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async addEvent(data: AddEventData): Promise<Event | null> {
    try {
      const event = await BaseDB.prisma.event.create({
        data: {
          title: data.title,
          start: data.start,
          end: data.end,
          isAllDay: data.isAllDay,
          categoryId: data.categoryId,
          description: data.description,
          url: data.url,
          creator: {
            connect: {
              id: data.creatorId
            }
          }
        }
      })

      // イベント作成時の初期値を格納
      const updatedFields = {
        title: data.title,
        start: data.start,
        end: data.end,
        isAllDay: data.isAllDay,
        categoryId: data.categoryId,
        description: data.description,
        url: data.url
      }

      // イベント作成のActivityを作成
      await Activity.logEventCreate(data.creatorId, {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.start,
        updatedFields
      })

      return event
    } catch (err) {
      console.error(err)
      return null
    }
  }

  async updateEvent(id: number, data: UpdateEventData): Promise<Event | null> {
    try {
      // 更新前のイベントデータを取得
      const currentEvent = await BaseDB.prisma.event.findUnique({
        where: { id }
      })

      if (!currentEvent) {
        return null
      }

      // 変更されたフィールドを特定
      const updatedFields: Record<string, unknown> = {}
      if (data.title !== currentEvent.title) updatedFields.title = data.title
      if (data.start.getTime() !== currentEvent.start.getTime()) updatedFields.start = data.start
      if (data.end.getTime() !== currentEvent.end.getTime()) updatedFields.end = data.end
      if (data.isAllDay !== currentEvent.isAllDay) updatedFields.isAllDay = data.isAllDay
      if (data.categoryId !== currentEvent.categoryId) updatedFields.categoryId = data.categoryId
      if (data.description !== currentEvent.description)
        updatedFields.description = data.description
      if (data.url !== currentEvent.url) updatedFields.url = data.url

      // イベントを更新
      const event = await BaseDB.prisma.event.update({
        where: { id },
        data: data
      })

      // イベント更新のActivityを作成
      await Activity.logEventUpdate(event.creatorId, {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.start,
        updatedFields
      })

      return event
    } catch (err) {
      console.error(err)
      return null
    }
  }

  async deleteEvent(id: number): Promise<Event | null> {
    try {
      // イベントを取得
      const event = await BaseDB.prisma.event.findUnique({
        where: { id },
        include: {
          Comments: true
        }
      })

      if (!event) {
        return null
      }

      // 関連するコメントを削除
      if (event.Comments.length > 0) {
        await BaseDB.prisma.comment.deleteMany({
          where: {
            eventId: id
          }
        })
      }

      // イベントを削除
      const deletedEvent = await BaseDB.prisma.event.delete({
        where: { id }
      })

      // イベント削除のActivityを作成
      await Activity.logEventDelete(event.creatorId, {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.start
      })

      return deletedEvent
    } catch (err) {
      console.error(err)
      return null
    }
  }
}

export default new EventDB()
