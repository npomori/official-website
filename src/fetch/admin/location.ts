import config from '@/config/config.json'
import { BaseApiFetch } from '../base'

interface LocationResponse {
  locations: any[]
}

class AdminLocationFetch extends BaseApiFetch {
  // 管理者用の活動地一覧を取得
  async getLocations() {
    const response = await this.request<LocationResponse>(`${config.api.adminUrl}/location`)
    return response
  }

  // 管理者用の個別の活動地を取得
  async getLocationById(id: string) {
    return await this.request<any>(`${config.api.adminUrl}/location/${id}`)
  }

  // 管理者用の活動地を作成（ファイルアップロード対応）
  async createLocationWithFiles(formData: FormData) {
    const response = await this.requestWithFormData<any>(
      `${config.api.adminUrl}/location`,
      formData,
      'POST'
    )
    return response
  }

  // 管理者用の活動地を更新（ファイルアップロード対応）
  async updateLocationWithFiles(id: string, formData: FormData) {
    const response = await this.requestWithFormData<any>(
      `${config.api.adminUrl}/location/${id}`,
      formData,
      'PUT'
    )
    return response
  }

  // 管理者用の活動地を削除
  async deleteLocation(id: string) {
    const response = await this.request<{ success: boolean; message: string }>(
      `${config.api.adminUrl}/location/${id}`,
      {
        method: 'DELETE'
      }
    )
    return response
  }
}

// シングルトンインスタンスをエクスポート
export default new AdminLocationFetch()
