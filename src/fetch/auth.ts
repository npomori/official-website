import config from '@/config/config.json'
import { BaseApiFetch } from './base'

interface AuthResponse {
  message: string
}

interface VerifyResetTokenResponse {
  valid: boolean
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

  async forgotPassword(email: string) {
    return this.requestWithJson<AuthResponse>(
      `${config.api.rootUrl}/auth/forgot-password`,
      { email },
      'POST'
    )
  }

  async verifyResetToken(token: string) {
    return this.request<VerifyResetTokenResponse>(
      `${config.api.rootUrl}/auth/verify-reset-token?token=${encodeURIComponent(token)}`,
      { method: 'GET' }
    )
  }

  async resetPassword(token: string, newPassword: string) {
    return this.requestWithJson<AuthResponse>(
      `${config.api.rootUrl}/auth/reset-password`,
      { token, newPassword },
      'POST'
    )
  }

  async verifyUser(token: string, password: string) {
    return this.requestWithJson<AuthResponse>(
      `${config.api.rootUrl}/auth/verify`,
      { token, password },
      'POST'
    )
  }
}

export default new AuthFetch()
