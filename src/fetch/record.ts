import { getConfig } from '@/types/config'
import type { Record, RecordResponse } from '@/types/record'
import { BaseApiFetch } from './base'

class RecordFetch extends BaseApiFetch {
  async getRecords(page: number = 1, limit?: number, category?: string) {
    const config = getConfig()
    const defaultLimit = config.pagination?.recordList?.itemsPerPage || 10
    const itemsPerPage = limit || defaultLimit

    const params = new URLSearchParams({
      page: page.toString(),
      limit: itemsPerPage.toString()
    })

    if (category) {
      params.append('category', category)
    }

    const response = await this.request<RecordResponse>(
      `${config.api.rootUrl}/record?${params.toString()}`
    )
    return response
  }

  // 個別の記録を取得
  async getRecordById(id: number) {
    const config = getConfig()
    return await this.request<Record>(`${config.api.rootUrl}/record/${id}`)
  }
}

export default new RecordFetch()
