import { getConfig } from '@/types/config'
import type {
  Record,
  RecordAdminRequest,
  RecordCreateRequest,
  RecordCreateResponse,
  RecordCreateWithImagesRequest,
  RecordDeleteResponse,
  RecordDetailResponse,
  RecordUpdateWithImagesRequest,
  RecordUploadResponse
} from '@/types/record'
import { BaseApiFetch } from '../base'

class AdminRecordFetch extends BaseApiFetch {
  async createRecord(params: RecordCreateRequest) {
    const config = getConfig()
    const response = await this.requestWithJson<Record>(
      `${config.api.adminUrl}/record`,
      params,
      'POST'
    )
    return response
  }

  async createRecordWithImages(params: RecordCreateWithImagesRequest) {
    const config = getConfig()
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

    const response = await this.requestWithFormData<Record>(
      `${config.api.adminUrl}/record`,
      formData,
      'POST'
    )
    return response
  }

  async updateRecord(id: number, params: RecordAdminRequest) {
    const config = getConfig()
    const response = await this.requestWithJson<Record>(
      `${config.api.adminUrl}/record/${id}`,
      params,
      'PUT'
    )
    return response
  }

  async updateRecordWithImages(id: number, params: RecordUpdateWithImagesRequest) {
    const config = getConfig()
    const formData = new FormData()

    // フォームデータを追加
    formData.append('data', JSON.stringify(params.data))

    // 画像ファイルを追加
    if (params.images && params.images.length > 0) {
      params.images.forEach((file) => {
        formData.append('images', file)
      })
    }

    const response = await this.requestWithFormData<Record>(
      `${config.api.adminUrl}/record/${id}`,
      formData,
      'PUT'
    )
    return response
  }

  async deleteRecord(id: number) {
    const config = getConfig()
    const response = await this.request<Record>(`${config.api.adminUrl}/record/${id}`, {
      method: 'DELETE'
    })
    return response
  }

  async getRecord(id: number) {
    const config = getConfig()
    const response = await this.request<Record>(`${config.api.adminUrl}/record/${id}`)
    return response
  }

  // 個別の記録を取得（getRecordByIdとして統一）
  async getRecordById(id: number) {
    const config = getConfig()
    const response = await this.request<Record>(`${config.api.adminUrl}/record/${id}`)
    return response
  }
}

export default new AdminRecordFetch()
