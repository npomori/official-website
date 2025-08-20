import config from '@/config/config.json'
import type { DashboardResponse } from '@/types/dashboard'
import { BaseApiFetch } from '../base'

class AdminDashboardFetch extends BaseApiFetch {
  async getDashboardData() {
    return this.request<DashboardResponse>(`${config.api.adminUrl}/dashboard`)
  }
}

export default new AdminDashboardFetch()
