import config from '@/config/config.json'
import type { UserAdminRequest } from '@/types/user'

class AdminUserFetch {
  async getUsers(): Promise<Response> {
    const response = await fetch(`${config.api.adminUrl}/user`)
    return response
  }
  async addUser(params: UserAdminRequest): Promise<Response> {
    const response = await fetch(`${config.api.adminUrl}/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
    return response
  }

  async updateUser(id: number, params: UserAdminRequest): Promise<Response> {
    const response = await fetch(`${config.api.adminUrl}/user/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
    return response
  }

  async deleteUser(id: number): Promise<Response> {
    const response = await fetch(`${config.api.adminUrl}/user/${id}`, {
      method: 'DELETE'
    })
    return response
  }
}

export default new AdminUserFetch()
