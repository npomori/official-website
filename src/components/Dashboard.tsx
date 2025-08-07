import config from '@/config/config.json'
import AdminDashboardFetch from '@/fetch/admin/dashboard'
import type { AdminStats, RecentActivity, UserStats } from '@/types/dashboard'
import { useEffect, useState } from 'react'

const Dashboard: React.FC = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [recentAdminActivities, setRecentAdminActivities] = useState<RecentActivity[]>([])
  const [recentUserActivities, setRecentUserActivities] = useState<RecentActivity[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await AdminDashboardFetch.getDashboardData()
        if (!response) {
          throw new Error('ダッシュボードデータの取得に失敗しました')
        }
        const data = await response.json()
        setUserStats(data.userStats)
        setAdminStats(data.adminStats)
        setRecentAdminActivities(
          data.recentActivities.admin.slice(0, config.dashboard.recentActivities.admin)
        )
        setRecentUserActivities(
          data.recentActivities.user.slice(0, config.dashboard.recentActivities.user)
        )
      } catch (error) {
        console.error('ダッシュボードデータの取得に失敗しました:', error)
      }
    }

    fetchDashboardData()
  }, [])

  if (!userStats || !adminStats) {
    return <div className="p-4">データを読み込み中...</div>
  }

  // 活動タイプに応じたラベルを取得
  const getActivityTypeLabel = (type: string): string => {
    switch (type) {
      case 'ADMIN_EVENT_CREATE':
      case 'ADMIN_EVENT_UPDATE':
      case 'ADMIN_EVENT_DELETE':
        return 'イベント管理'
      case 'ADMIN_USER_CREATE':
      case 'ADMIN_USER_UPDATE':
      case 'ADMIN_USER_DELETE':
        return 'ユーザ管理'
      case 'ADMIN_SYSTEM_UPDATE':
      case 'ADMIN_ROLE_UPDATE':
        return 'システム設定'
      case 'USER_COMMENT_CREATE':
        return 'コメント作成'
      case 'USER_COMMENT_UPDATE':
        return 'コメント更新'
      case 'USER_COMMENT_DELETE':
        return 'コメント削除'
      case 'USER_PROFILE_UPDATE':
        return 'プロフィール'
      case 'USER_EVENT_JOIN':
        return 'イベント参加'
      case 'USER_EVENT_CANCEL':
        return 'イベントキャンセル'
      default:
        return 'その他'
    }
  }

  // 活動タイプに応じた色を取得
  const getActivityTypeColor = (type: string): string => {
    if (type.startsWith('ADMIN_EVENT_')) return 'blue'
    if (type.startsWith('ADMIN_USER_')) return 'green'
    if (type.startsWith('ADMIN_SYSTEM_') || type.startsWith('ADMIN_ROLE_')) return 'purple'
    if (type.startsWith('USER_COMMENT_')) return 'orange'
    if (type.startsWith('USER_PROFILE_')) return 'indigo'
    if (type.startsWith('USER_EVENT_')) return 'pink'
    return 'gray'
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
      </div>

      {/* ユーザ活動セクション */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">ユーザ活動</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-500">
                <svg
                  className="h-4 w-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 18"
                >
                  <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">総ユーザ数</h3>
                <p className="text-2xl font-bold text-blue-600">{userStats.totalUsers}</p>
                <p className="text-gray-500">前月比 +12%</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">
                <svg
                  className="h-4 w-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 18"
                >
                  <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">アクティブユーザ</h3>
                <p className="text-2xl font-bold text-green-600">{userStats.activeUsers}</p>
                <p className="text-gray-500">直近30日間</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-500">
                <svg
                  className="h-4 w-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 18"
                >
                  <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">新規登録</h3>
                <p className="text-2xl font-bold text-purple-600">{userStats.newRegistrations}</p>
                <p className="text-gray-500">今月</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500">
                <svg
                  className="h-4 w-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 18"
                >
                  <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">コメント数</h3>
                <p className="text-2xl font-bold text-orange-600">{userStats.totalComments}</p>
                <p className="text-gray-500">今月</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 管理者活動セクション */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">管理者活動</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-500">
                <svg
                  className="h-4 w-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 18"
                >
                  <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">イベント管理</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {adminStats.eventManagement.count}
                </p>
                <p className="text-gray-500">前月比 {adminStats.eventManagement.trend}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500">
                <svg
                  className="h-4 w-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 18"
                >
                  <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">ユーザ管理</h3>
                <p className="text-2xl font-bold text-green-600">
                  {adminStats.userManagement.count}
                </p>
                <p className="text-gray-500">前月比 {adminStats.userManagement.trend}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center">
              <div className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-500">
                <svg
                  className="h-4 w-4"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 18"
                >
                  <path d="M14 2a3.963 3.963 0 0 0-1.4.267 6.439 6.439 0 0 1-1.331 6.638A4 4 0 1 0 14 2Zm1 9h-1.264A6.957 6.957 0 0 1 15 15v2a2.97 2.97 0 0 1-.184 1H19a1 1 0 0 0 1-1v-1a5.006 5.006 0 0 0-5-5ZM6.5 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 10H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-700">システム設定</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {adminStats.systemSettings.count}
                </p>
                <p className="text-gray-500">前月比 {adminStats.systemSettings.trend}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 最近の活動セクション */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">最近の活動</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* ユーザの最近の活動 */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">ユーザの最近の活動</h3>
            <div className="space-y-4">
              {recentUserActivities.map((activity) => (
                <div key={activity.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block rounded px-2 py-1 text-sm font-semibold text-${getActivityTypeColor(
                            activity.type
                          )}-800 bg-${getActivityTypeColor(activity.type)}-100`}
                        >
                          {getActivityTypeLabel(activity.type)}
                        </span>
                        <span className="text-gray-500">{activity.userName || '不明'}</span>
                      </div>
                      <span className="text-gray-500">
                        {new Date(activity.createdAt).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    {activity.type.startsWith('USER_COMMENT_') ? (
                      <>
                        <p className="mt-2 text-gray-600">{activity.description}</p>
                        <p className="mt-1 font-medium text-gray-900">
                          投稿者: {activity.metadata?.creatorName || '不明'}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-gray-600">{activity.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 管理者の最近の活動 */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">管理者の最近の活動</h3>
            <div className="space-y-4">
              {recentAdminActivities.map((activity) => (
                <div key={activity.id} className="border-b border-gray-200 pb-4 last:border-0">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block rounded px-2 py-1 text-sm font-semibold text-${getActivityTypeColor(
                            activity.type
                          )}-800 bg-${getActivityTypeColor(activity.type)}-100`}
                        >
                          {getActivityTypeLabel(activity.type)}
                        </span>
                        <span className="text-gray-500">{activity.userName || '不明'}</span>
                      </div>
                      <span className="text-gray-500">
                        {new Date(activity.createdAt).toLocaleString('ja-JP')}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-600">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
