import { DashboardDB } from '@/server/db'
import type { DashboardResponse } from '@/types/dashboard'
import type { APIRoute } from 'astro'

export const GET: APIRoute = async () => {
  try {
    // ダッシュボードデータの取得
    const stats = await DashboardDB.getDashboardStats()
    if (!stats) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'ダッシュボードデータの取得に失敗しました'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const response: DashboardResponse = {
      userStats: stats.userStats,
      adminStats: stats.adminStats,
      recentActivities: {
        admin: stats.recentAdminActivities,
        user: stats.recentUserActivities
      },
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: response
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Dashboard API Error:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'ダッシュボードデータの取得に失敗しました'
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
