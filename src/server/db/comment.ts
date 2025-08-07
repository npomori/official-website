import { Activity } from '@/server/utils/activity'
import BaseDB from './base'

interface AddCommentData {
  content: string
  eventId: number
  creatorId: number
}

interface Comment {
  id: number
  content: string
  eventId: number
  creatorId: number
  createdAt: Date
  updatedAt: Date
  creator: {
    id: number
    name: string
    avatar: string | null
  }
}

class CommentDB extends BaseDB {
  async getCommentById(id: number): Promise<Comment | null> {
    try {
      const comment = await BaseDB.prisma.comment.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })
      return comment
    } catch (err) {
      console.error('コメントの取得に失敗しました:', err)
      return null
    }
  }

  async getComments(eventId: number): Promise<Comment[]> {
    try {
      const comments = await BaseDB.prisma.comment.findMany({
        where: {
          eventId: eventId
        },
        orderBy: [
          {
            id: 'asc'
          }
        ],
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })
      return comments
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async getCommentsByEventId(eventId: number): Promise<Comment[]> {
    try {
      const comments = await BaseDB.prisma.comment.findMany({
        where: {
          eventId: eventId
        },
        orderBy: {
          id: 'asc'
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      })
      return comments
    } catch (err) {
      console.error('コメントの取得に失敗しました:', err)
      return []
    }
  }

  async addComment(userId: number, data: AddCommentData): Promise<Comment | null> {
    try {
      const comment = await BaseDB.prisma.comment.create({
        data: {
          content: data.content,
          eventId: data.eventId,
          creatorId: data.creatorId
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          event: {
            select: {
              title: true
            }
          }
        }
      })

      // コメント投稿のActivityを作成
      await Activity.logUserComment(userId, {
        creatorId: comment.creator.id,
        creatorName: comment.creator.name,
        commentContent: data.content,
        commentId: comment.id,
        eventId: data.eventId,
        eventTitle: comment.event.title
      })

      return comment
    } catch (err) {
      console.error('コメントの登録に失敗しました:', err)
      return null
    }
  }

  async deleteComment(userId: number, id: number): Promise<Comment | null> {
    try {
      const comment = await BaseDB.prisma.comment.delete({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          },
          event: {
            select: {
              title: true
            }
          }
        }
      })

      // コメント削除のActivityを作成
      await Activity.logActivity({
        type: 'USER_COMMENT_DELETE',
        title: 'コメント削除',
        description: comment.content,
        metadata: {
          creatorId: comment.creator.id,
          creatorName: comment.creator.name,
          commentId: comment.id,
          eventId: comment.eventId,
          eventTitle: comment.event.title
        },
        userId: userId // アクティビティを実行したユーザ
      })

      return comment
    } catch (err) {
      console.error('コメントの削除に失敗しました:', err)
      return null
    }
  }
}

export default new CommentDB()
