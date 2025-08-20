import config from '@/config/config.json'
import { BaseApiFetch } from './base'

interface LoginRequest {
  email: string
  password: string
  rememberMe: boolean
}

interface AuthResponse {
  message: string
}

class AuthFetch extends BaseApiFetch {
  async login(email: string, password: string, rememberMe: boolean) {
    return this.requestWithJson<AuthResponse>(
      `${config.api.rootUrl}/auth/login`,
      { email, password, rememberMe },
      'POST'
    )
  }

  async logout() {
    return this.request<AuthResponse>(`${config.api.rootUrl}/auth/logout`, { method: 'POST' })
  }
}

export default new AuthFetch()
