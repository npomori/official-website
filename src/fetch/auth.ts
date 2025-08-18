import config from '@/config/config.json'

class AuthFetch {
  async login(email: string, password: string, rememberMe: boolean): Promise<Response> {
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
  }
  async logout(): Promise<Response> {
    const response = await fetch(`${config.api.rootUrl}/auth/logout`, {
      method: 'POST'
    })
    return response
  }
}
export default new AuthFetch()
