import config from '@/config/config.json'

class AdminDashboardFetch {
  async getDashboardData(): Promise<any> {
    try {
      const response = await fetch(`${config.api.adminUrl}/dashboard`)
      return response
    } catch (e) {
      return null
    }
  }
}
export default new AdminDashboardFetch()
