import config from '@/config/config.json'

class AdminDashboardFetch {
  async getDashboardData(): Promise<Response> {
    const response = await fetch(`${config.api.adminUrl}/dashboard`)
    return response
  }
}
export default new AdminDashboardFetch()
