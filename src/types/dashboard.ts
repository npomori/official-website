import type { ActivityType } from './activity'

// ユーザ統計情報
export interface UserStats {
  totalUsers: number
  activeUsers: number
  newRegistrations: number
  totalComments: number
}

// 管理者統計情報
export interface AdminStats {
  eventManagement: {
    count: number
    trend: string
  }
  userManagement: {
    count: number
    trend: string
  }
  systemSettings: {
    count: number
    trend: string
  }
}

// 最近の活動情報
export interface RecentActivity {
  id: string
  type: ActivityType
  title: string
  description: string
  userId: number
  userName: string
  metadata: Record<string, unknown>
  createdAt: Date
}

// ダッシュボードAPIのレスポンス型
export interface DashboardResponse {
  userStats: UserStats
  adminStats: AdminStats
  recentActivities: {
    admin: RecentActivity[]
    user: RecentActivity[]
  }
  timestamp: string
}
