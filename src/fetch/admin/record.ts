import config from '@/config/config.json'
import type { Record } from '@/types/record'

interface RecordAdminRequest {
  location: string
  datetime: string
  eventDate?: Date
  weather: string
  participants: string
  reporter: string
  content: string
  nearMiss?: string | undefined
  equipment?: string | undefined
  remarks?: string | undefined
  categories?: string[] | undefined
  images?: string[] | undefined
}

interface RecordCreateRequest {
  dateForFilename: string
  data: {
    location: string
    datetime: string
    weather: string
    participants: string
    reporter: string
    content: string
    nearMiss?: string | undefined
    equipment?: string | undefined
    remarks?: string | undefined
    categories?: string[] | undefined
    images?: string[] | undefined
  }
}

interface RecordCreateResponse {
  success: boolean
  message: string
  record?: Record
}

interface RecordUploadResponse {
  success: boolean
  files: string[]
  message?: string
}

interface RecordCreateWithImagesRequest {
  dateForFilename: string
  data: {
    location: string
    datetime: string
    weather: string
    participants: string
    reporter: string
    content: string
    nearMiss?: string | undefined
    equipment?: string | undefined
    remarks?: string | undefined
    categories?: string[] | undefined
  }
  images?: File[]
}

interface RecordUpdateWithImagesRequest {
  data: {
    location: string
    datetime: string
    weather: string
    participants: string
    reporter: string
    content: string
    nearMiss?: string | undefined
    equipment?: string | undefined
    remarks?: string | undefined
    categories?: string[] | undefined
    images?: string[] | undefined
  }
  images?: File[]
}

class AdminRecordFetch {
  async createRecord(params: RecordCreateRequest): Promise<RecordCreateResponse> {
    try {
      const response = await fetch(`${config.api.adminUrl}/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '記録の作成に失敗しました')
      }

      return await response.json()
    } catch (error) {
      console.error('Record creation error:', error)
      throw error
    }
  }

  async createRecordWithImages(
    params: RecordCreateWithImagesRequest
  ): Promise<RecordCreateResponse> {
    try {
      const formData = new FormData()

      // フォームデータを追加
      formData.append('dateForFilename', params.dateForFilename)
      formData.append('data', JSON.stringify(params.data))

      // 画像ファイルを追加
      if (params.images && params.images.length > 0) {
        params.images.forEach((file) => {
          formData.append('images', file)
        })
      }

      const response = await fetch(`${config.api.adminUrl}/record`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '記録の作成に失敗しました')
      }

      return await response.json()
    } catch (error) {
      console.error('Record creation with images error:', error)
      throw error
    }
  }

  async updateRecord(id: number, params: RecordAdminRequest): Promise<any> {
    try {
      const response = await fetch(`${config.api.adminUrl}/record/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        throw new Error('記録の更新に失敗しました')
      }

      return await response.json()
    } catch (error) {
      console.error('Record update error:', error)
      throw error
    }
  }

  async updateRecordWithImages(id: number, params: RecordUpdateWithImagesRequest): Promise<any> {
    try {
      const formData = new FormData()

      // フォームデータを追加
      formData.append('data', JSON.stringify(params.data))

      // 画像ファイルを追加
      if (params.images && params.images.length > 0) {
        params.images.forEach((file) => {
          formData.append('images', file)
        })
      }

      const response = await fetch(`${config.api.adminUrl}/record/${id}`, {
        method: 'PUT',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '記録の更新に失敗しました')
      }

      return await response.json()
    } catch (error) {
      console.error('Record update with images error:', error)
      throw error
    }
  }

  async deleteRecord(id: number): Promise<any> {
    try {
      const response = await fetch(`${config.api.adminUrl}/record/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('記録の削除に失敗しました')
      }

      return await response.json()
    } catch (error) {
      console.error('Record deletion error:', error)
      throw error
    }
  }

  async getRecord(id: number): Promise<any> {
    try {
      const response = await fetch(`${config.api.adminUrl}/record/${id}`)

      if (!response.ok) {
        throw new Error('記録の取得に失敗しました')
      }

      return await response.json()
    } catch (error) {
      console.error('Record fetch error:', error)
      throw error
    }
  }
}

export default new AdminRecordFetch()
