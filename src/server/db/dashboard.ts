import type { ActivityType } from '@/types/activity'
import BaseDB from './base'

class DashboardDB extends BaseDB {
  // ダッシュボードの統計情報を取得
  async getDashboardStats() {
    try {
      // ユーザ統計情報の取得
      const [totalUsers, activeUsers, newRegistrations, totalComments] = await Promise.all([
        // 総ユーザ数
        BaseDB.prisma.user.count(),
        // アクティブユーザ数（30日以内にログイン）
        BaseDB.prisma.user.count({
          where: {
            lastLoginAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        // 新規登録ユーザ数（今月）
        BaseDB.prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        // 今月のコメント数
        BaseDB.prisma.comment.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      ])

      // 管理者統計情報の取得
      const [eventManagementCount, userManagementCount, systemSettingsCount] = await Promise.all([
        // イベント管理関連の活動数
        BaseDB.prisma.activity.count({
          where: {
            type: {
              in: ['ADMIN_EVENT_CREATE', 'ADMIN_EVENT_UPDATE', 'ADMIN_EVENT_DELETE']
            },
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        // ユーザ管理関連の活動数
        BaseDB.prisma.activity.count({
          where: {
            type: {
              in: ['ADMIN_USER_CREATE', 'ADMIN_USER_UPDATE', 'ADMIN_USER_DELETE']
            },
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        // システム設定関連の活動数
        BaseDB.prisma.activity.count({
          where: {
            type: {
              in: ['ADMIN_SYSTEM_UPDATE', 'ADMIN_ROLE_UPDATE']
            },
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      ])

      // 前月の統計情報を取得してトレンドを計算
      const [prevEventManagementCount, prevUserManagementCount, prevSystemSettingsCount] =
        await Promise.all([
          BaseDB.prisma.activity.count({
            where: {
              type: {
                in: ['ADMIN_EVENT_CREATE', 'ADMIN_EVENT_UPDATE', 'ADMIN_EVENT_DELETE']
              },
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          }),
          BaseDB.prisma.activity.count({
            where: {
              type: {
                in: ['ADMIN_USER_CREATE', 'ADMIN_USER_UPDATE', 'ADMIN_USER_DELETE']
              },
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          }),
          BaseDB.prisma.activity.count({
            where: {
              type: {
                in: ['ADMIN_SYSTEM_UPDATE', 'ADMIN_ROLE_UPDATE']
              },
              createdAt: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
                lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          })
        ])

      // 最近の活動を取得
      const [recentAdminActivities, recentUserActivities] = await Promise.all([
        // 管理者の最近の活動
        BaseDB.prisma.activity.findMany({
          where: {
            type: {
              startsWith: 'ADMIN_'
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10,
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }),
        // ユーザの最近の活動
        BaseDB.prisma.activity.findMany({
          where: {
            type: {
              startsWith: 'USER_'
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10,
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        })
      ])

      // トレンドの計算
      const calculateTrend = (current: number, previous: number): string => {
        if (previous === 0) return current > 0 ? '+100%' : '0%'
        const change = ((current - previous) / previous) * 100
        return `${change >= 0 ? '+' : ''}${Math.round(change)}%`
      }

      return {
        userStats: {
          totalUsers,
          activeUsers,
          newRegistrations,
          totalComments
        },
        adminStats: {
          eventManagement: {
            count: eventManagementCount,
            trend: calculateTrend(eventManagementCount, prevEventManagementCount)
          },
          userManagement: {
            count: userManagementCount,
            trend: calculateTrend(userManagementCount, prevUserManagementCount)
          },
          systemSettings: {
            count: systemSettingsCount,
            trend: calculateTrend(systemSettingsCount, prevSystemSettingsCount)
          }
        },
        recentAdminActivities: recentAdminActivities.map((activity) => ({
          id: activity.id.toString(),
          type: activity.type as ActivityType,
          title: activity.title,
          description: activity.description || '',
          userId: activity.userId,
          userName: activity.user.name,
          metadata: activity.metadata as Record<string, unknown>,
          createdAt: activity.createdAt
        })),
        recentUserActivities: recentUserActivities.map((activity) => ({
          id: activity.id.toString(),
          type: activity.type as ActivityType,
          title: activity.title,
          description: activity.description || '',
          userId: activity.userId,
          userName: activity.user.name,
          metadata: activity.metadata as Record<string, unknown>,
          createdAt: activity.createdAt
        }))
      }
    } catch (err) {
      console.error('ダッシュボード統計の取得に失敗しました:', err)
      return null
    }
  }
}

export default new DashboardDB()
