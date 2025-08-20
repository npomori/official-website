import config from '@/config/config.json'
import type { IUser, UserRole } from '@/types/user'
import { BaseApiFetch } from '../base'

export interface UserAdminRequest {
  email: string
  name: string
  password: string | null
  role: UserRole
  isEnabled: boolean
}

class AdminUserFetch extends BaseApiFetch {
  async getUsers() {
    return this.request<IUser[]>(`${config.api.adminUrl}/user`)
  }

  async addUser(params: UserAdminRequest) {
    return this.requestWithJson<IUser>(`${config.api.adminUrl}/user`, params, 'POST')
  }

  async updateUser(id: number, params: UserAdminRequest) {
    return this.requestWithJson<IUser>(`${config.api.adminUrl}/user/${id}`, params, 'PUT')
  }

  async deleteUser(id: number) {
    return this.request<{ message: string }>(`${config.api.adminUrl}/user/${id}`, {
      method: 'DELETE'
    })
  }
}

export default new AdminUserFetch()
