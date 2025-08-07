import config from '@/config/config.json'

class AuthFetch {
  async login(email: string, password: string, rememberMe: boolean): Promise<any> {
    try {
      const response = await fetch(`${config.api.rootUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          password: password,
          rememberMe: rememberMe
        })
      })
      return response
    } catch (e) {
      return null
    }
  }
  async logout(): Promise<any> {
    try {
      const response = await fetch(`${config.api.rootUrl}/auth/logout`, {
        method: 'POST'
      })
      return response
    } catch (e) {
      return null
    }
  }
}
export default new AuthFetch()
