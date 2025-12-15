import type { Prisma } from '@/generated/prisma/client'
import BaseDB from './base'

/**
 * Location データベース操作クラス
 * 活動地情報のCRUD操作を提供
 */
class LocationDB extends BaseDB {
  /**
   * 全活動地を取得
   */
  async findAll() {
    return await BaseDB.prisma.location.findMany({
      where: {
        status: 'published'
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
  }

  /**
   * IDで活動地を取得
   */
  async findById(id: string) {
    return await BaseDB.prisma.location.findFirst({
      where: {
        id,
        status: 'published'
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  /**
   * タイプ別に活動地を取得
   * @param type 'regular' | 'activity'
   */
  async findByType(type: string) {
    return await BaseDB.prisma.location.findMany({
      where: {
        type,
        status: 'published'
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
  }

  /**
   * 名前で活動地を検索（部分一致）
   */
  async findByName(name: string) {
    return await BaseDB.prisma.location.findFirst({
      where: {
        name: {
          contains: name
        },
        status: 'published'
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  /**
   * 詳細情報を持つ活動地のみを取得
   */
  async findWithDetails() {
    return await BaseDB.prisma.location.findMany({
      where: {
        hasDetail: true,
        status: 'published'
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
  }

  /**
   * 活動地を作成（管理用）
   */
  async create(data: Prisma.LocationCreateInput) {
    return await BaseDB.prisma.location.create({
      data,
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  /**
   * 活動地を更新（管理用）
   */
  async update(id: string, data: Prisma.LocationUpdateInput) {
    return await BaseDB.prisma.location.update({
      where: { id },
      data,
      include: {
        creator: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  }

  /**
   * 活動地を削除（管理用）
   */
  async delete(id: string) {
    return await BaseDB.prisma.location.delete({
      where: { id }
    })
  }

  /**
   * 管理用: ステータスに関わらず全活動地を取得
   */
  async findAllAdmin() {
    return await BaseDB.prisma.location.findMany({
      select: {
        id: true,
        name: true,
        position: true,
        type: true,
        activities: true,
        image: true,
        address: true,
        hasDetail: true,
        activityDetails: true,
        fieldCharacteristics: true,
        meetingAddress: true,
        meetingTime: true,
        meetingMapUrl: true,
        meetingAdditionalInfo: true,
        access: true,
        facilities: true,
        schedule: true,
        requirements: true,
        participationFee: true,
        contact: true,
        organizer: true,
        startedDate: true,
        upcomingDates: true,
        notes: true,
        other: true,
        images: true,
        attachments: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        creatorId: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
  }

  /**
   * 管理用: ステータスに関わらずIDで取得
   */
  async findByIdAdmin(id: string) {
    return await BaseDB.prisma.location.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        position: true,
        type: true,
        activities: true,
        image: true,
        address: true,
        hasDetail: true,
        activityDetails: true,
        fieldCharacteristics: true,
        meetingAddress: true,
        meetingTime: true,
        meetingMapUrl: true,
        meetingAdditionalInfo: true,
        access: true,
        facilities: true,
        schedule: true,
        requirements: true,
        participationFee: true,
        contact: true,
        organizer: true,
        startedDate: true,
        upcomingDates: true,
        notes: true,
        other: true,
        images: true,
        attachments: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        creatorId: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  }

  /**
   * 指定されたfilenameを含む添付ファイルを持つ活動地を検索
   */
  async findAllWithAttachment(filename: string) {
    return await BaseDB.prisma.location.findMany({
      select: {
        id: true,
        attachments: true
      }
    })
  }
}

export default new LocationDB()
