import ActivityDB from '@/server/db/activity'
import type {
  ActivityLog,
  ActivityType,
  CommentActivityData,
  EventActivityData
} from '@/types/activity'

export class Activity {
  public static async logActivity(data: ActivityLog): Promise<boolean> {
    if (!data.userId) {
      console.error('userId is required')
      return false
    }

    const log: ActivityLog = {
      type: data.type,
      title: data.title,
      description: data.description ?? '',
      metadata: data.metadata ?? {},
      userId: data.userId // アクティビティを実行したユーザ
    }

    const result = await ActivityDB.createActivity(log)
    if (result) {
      return true
    } else {
      return false
    }
  }

  // ユーザ用ヘルパーメソッド
  public static async logUserComment(userId: number, data: CommentActivityData): Promise<boolean> {
    return Activity.logActivity({
      type: 'USER_COMMENT_CREATE',
      title: 'コメント投稿',
      description: data.commentContent,
      metadata: {
        // コメントの情報
        creatorId: data.creatorId,
        creatorName: data.creatorName,
        commentId: data.commentId,
        eventId: data.eventId,
        eventTitle: data.eventTitle
      },
      userId: userId // アクティビティを実行したユーザ
    })
  }

  public static async logUserProfileUpdate(
    userId: number,
    updatedFields: Record<string, unknown>,
    detailMessage?: string
  ): Promise<boolean> {
    return Activity.logActivity({
      type: 'USER_PROFILE_UPDATE',
      title: 'プロフィール更新',
      description: detailMessage || 'プロフィール情報を更新しました',
      userId,
      metadata: {
        updatedFields
      }
    })
  }

  // イベント操作のログメソッド
  public static async logEventCreate(userId: number, data: EventActivityData): Promise<boolean> {
    const eventDate = new Date(data.eventDate).toLocaleDateString('ja-JP')
    return Activity.logActivity({
      type: 'ADMIN_EVENT_CREATE',
      title: 'イベント作成',
      description: `イベント「${data.eventTitle}」(${eventDate})を作成しました`,
      userId,
      metadata: {
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        updatedFields: data.updatedFields
      }
    })
  }

  public static async logEventUpdate(userId: number, data: EventActivityData): Promise<boolean> {
    const eventDate = new Date(data.eventDate).toLocaleDateString('ja-JP')
    return Activity.logActivity({
      type: 'ADMIN_EVENT_UPDATE',
      title: 'イベント更新',
      description: `イベント「${data.eventTitle}」(${eventDate})を更新しました`,
      userId,
      metadata: {
        eventId: data.eventId,
        eventTitle: data.eventTitle,
        updatedFields: data.updatedFields
      }
    })
  }

  public static async logEventDelete(userId: number, data: EventActivityData): Promise<boolean> {
    const eventDate = new Date(data.eventDate).toLocaleDateString('ja-JP')
    return Activity.logActivity({
      type: 'ADMIN_EVENT_DELETE',
      title: 'イベント削除',
      description: `イベント「${data.eventTitle}」(${eventDate})を削除しました`,
      userId,
      metadata: {
        eventId: data.eventId,
        eventTitle: data.eventTitle
      }
    })
  }

  // ユーザ操作のログメソッド
  public static async logUserCreate(
    userId: number,
    targetUserId: number,
    targetUserName: string,
    updatedFields: Record<string, unknown>
  ): Promise<boolean> {
    return Activity.logActivity({
      type: 'ADMIN_USER_CREATE',
      title: 'ユーザ作成',
      description: `ユーザ「${targetUserName}」を作成しました`,
      userId,
      metadata: {
        targetUserId,
        targetUserName,
        updatedFields
      }
    })
  }

  public static async logUserDelete(
    userId: number,
    targetUserId: number,
    targetUserName: string
  ): Promise<boolean> {
    return Activity.logActivity({
      type: 'ADMIN_USER_DELETE',
      title: 'ユーザ削除',
      description: `ユーザ「${targetUserName}」を削除しました`,
      userId,
      metadata: {
        targetUserId,
        targetUserName
      }
    })
  }

  public static async logUserUpdate(
    userId: number,
    targetUserId: number,
    targetUserName: string,
    updatedFields: Record<string, unknown>
  ): Promise<boolean> {
    return Activity.logActivity({
      type: 'ADMIN_USER_UPDATE',
      title: 'ユーザ更新',
      description: `ユーザ「${targetUserName}」の情報を更新しました`,
      userId,
      metadata: {
        targetUserId,
        targetUserName,
        updatedFields
      }
    })
  }

  // パスワード変更のログメソッド
  public static async logPasswordUpdate(
    userId: number,
    targetUserId: number,
    targetUserName: string
  ): Promise<boolean> {
    return Activity.logActivity({
      type: 'USER_PASSWORD_UPDATE',
      title: 'パスワード変更',
      description:
        userId === targetUserId
          ? 'パスワードを変更しました'
          : `ユーザ「${targetUserName}」のパスワードを変更しました`,
      userId,
      metadata: {
        targetUserId,
        targetUserName
      }
    })
  }

  public static async getRecentActivities(limit: number = 10): Promise<any[]> {
    return ActivityDB.getRecentActivities(limit)
  }

  public static async getActivitiesByType(type: ActivityType): Promise<any[]> {
    return ActivityDB.getActivitiesByType(type)
  }

  public static async getActivitiesByUser(userId: string): Promise<any[]> {
    return ActivityDB.getActivitiesByUser(userId)
  }

  public static async getAdminActivities(limit: number = 10): Promise<any[]> {
    return ActivityDB.getAdminActivities(limit)
  }

  public static async getUserActivities(limit: number = 10): Promise<any[]> {
    return ActivityDB.getUserActivities(limit)
  }
}
