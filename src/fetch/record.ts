import config from '@/config/config.json'

interface Record {
  id: number
  location: string
  datetime: string
  eventDate: Date
  weather: string
  participants: string
  reporter: string
  content: string
  nearMiss?: string | null
  equipment?: string | null
  remarks?: string | null
  categories?: string[] | null
  images?: string[] | null
  createdAt: Date
  updatedAt: Date
  creator: {
    id: number
    name: string
    email: string
  }
}

interface PaginationInfo {
  currentPage: number
  itemsPerPage: number
  totalCount: number
  totalPages: number
}

interface RecordListResponse {
  success: boolean
  data: {
    records: Record[]
    pagination: PaginationInfo
  }
}

class RecordFetch {
  async getRecords(
    page: number = 1,
    limit?: number,
    category?: string
  ): Promise<RecordListResponse> {
    try {
      const defaultLimit = config.pagination?.recordList?.itemsPerPage || 10
      const itemsPerPage = limit || defaultLimit

      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      })

      if (category) {
        params.append('category', category)
      }

      const url = `${config.api.rootUrl}/record?${params.toString()}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('記録データの取得に失敗しました')
      }

      return await response.json()
    } catch (error) {
      console.error('Record fetch error:', error)
      throw error
    }
  }
}

export default new RecordFetch()
