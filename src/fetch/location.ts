import config from '@/config/config.json'
import { BaseApiFetch } from './base'

interface LocationListResponse {
  locations: any[]
}

class LocationFetch extends BaseApiFetch {
  // 公開用の活動地一覧を取得
  async getLocations(params?: { type?: string; hasDetail?: boolean }) {
    const searchParams = new URLSearchParams()
    if (params?.type) {
      searchParams.append('type', params.type)
    }
    if (params?.hasDetail !== undefined) {
      searchParams.append('hasDetail', params.hasDetail.toString())
    }

    const url = searchParams.toString()
      ? `${config.api.url}/location?${searchParams.toString()}`
      : `${config.api.url}/location`

    const response = await this.request<LocationListResponse>(url)
    return response
  }

  // 公開用の個別の活動地を取得
  async getLocationById(id: string) {
    return await this.request<any>(`${config.api.url}/location/${id}`)
  }
}

// シングルトンインスタンスをエクスポート
export default new LocationFetch()
