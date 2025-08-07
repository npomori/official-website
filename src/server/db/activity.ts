import type { ActivityLog } from '@/types/activity'
import type { Activity } from '@prisma/client'
import BaseDB from './base'

class ActivityDB extends BaseDB {
  async createActivity(log: ActivityLog): Promise<Activity | null> {
    try {
      const activity = await BaseDB.prisma.activity.create({
        data: {
          type: log.type,
          title: log.title,
          description: log.description,
          metadata: log.metadata,
          userId: log.userId
        }
      })
      return activity
    } catch (err) {
      console.error(err)
      return null
    }
  }

  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    try {
      const activities = await BaseDB.prisma.activity.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: true
        }
      })

      return activities
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async getActivitiesByType(type: string, limit: number = 10): Promise<Activity[]> {
    try {
      const activities = await BaseDB.prisma.activity.findMany({
        where: {
          type
        },
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: true
        }
      })

      return activities
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async getActivitiesByUser(userId: string, limit: number = 10): Promise<Activity[]> {
    try {
      const activities = await BaseDB.prisma.activity.findMany({
        where: {
          userId: parseInt(userId)
        },
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: true
        }
      })

      return activities
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async getAdminActivities(limit: number = 10): Promise<Activity[]> {
    try {
      const activities = await BaseDB.prisma.activity.findMany({
        where: {
          type: {
            startsWith: 'ADMIN_'
          }
        },
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: true
        }
      })
      return activities
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async getUserActivities(limit: number = 10): Promise<Activity[]> {
    try {
      const activities = await BaseDB.prisma.activity.findMany({
        where: {
          type: {
            startsWith: 'USER_'
          }
        },
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: true
        }
      })

      return activities
    } catch (err) {
      console.error(err)
      return []
    }
  }
}

export default new ActivityDB()
