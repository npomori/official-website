// カレンダーに表示するイベント(省略形)
export interface EventResponse {
  id: number
  title: string
  start: string
  end: string
  allDay: boolean
  color: string
  commentCount?: number
  categoryIndex: number
}

// カレンダーの詳細画面に表示するイベント
export interface EventDetailResponse extends EventResponse {
  description: string
  url: string
}

// 管理画面に表示するイベント
export interface EventAdminResponse {
  id: number
  title: string
  start: string
  end: string
  allDay: boolean
  category: string
  description: string
  url: string
}

// 管理画面から登録するイベント
export interface EventAdminRequest {
  title: string
  allDay: boolean
  start: string
  end: string
  category: string
  description: string
  url: string
}
