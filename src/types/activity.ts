// 管理者の活動タイプ
export type AdminActivityType =
  | 'ADMIN_EVENT_CREATE' // イベント作成
  | 'ADMIN_EVENT_UPDATE' // イベント更新
  | 'ADMIN_EVENT_DELETE' // イベント削除
  | 'ADMIN_USER_CREATE' // ユーザ作成
  | 'ADMIN_USER_UPDATE' // ユーザ更新
  | 'ADMIN_USER_DELETE' // ユーザ削除
  | 'ADMIN_SYSTEM_UPDATE' // システム設定更新
  | 'ADMIN_ROLE_UPDATE' // 権限更新

// ユーザの活動タイプ
export type UserActivityType =
  | 'USER_COMMENT_CREATE' // コメント投稿
  | 'USER_COMMENT_UPDATE' // コメント更新
  | 'USER_COMMENT_DELETE' // コメント削除
  | 'USER_PROFILE_UPDATE' // プロフィール更新
  | 'USER_PASSWORD_UPDATE' // パスワード変更
  | 'USER_EVENT_JOIN' // イベント参加
  | 'USER_EVENT_CANCEL' // イベントキャンセル
  | 'USER_LOGIN' // ログイン
  | 'USER_LOGOUT' // ログアウト

export type ActivityType = AdminActivityType | UserActivityType

export interface ActivityLog {
  type: ActivityType
  title: string
  description: string
  metadata?: Record<string, unknown>
  //metadata: Record<string, unknown>
  userId: number // アクティビティを実行したユーザ
}

// コメント投稿時のアクティビティデータ型
export interface CommentActivityData {
  creatorId: number
  creatorName: string
  commentContent: string
  commentId: number
  eventId: number
  eventTitle: string
}

// イベント操作時のアクティビティデータ型
export interface EventActivityData {
  eventId: number
  eventTitle: string
  eventDate: Date
  updatedFields?: Record<string, unknown>
}
