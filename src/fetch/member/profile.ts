import config from '@/config/config.json'

class MemberProfileFetch {
  async updateProfile(id: number, params: FormData): Promise<any> {
    try {
      const response = await fetch(`${config.api.memberUrl}/profile/${id}`, {
        method: 'PUT',
        body: params
      })
      return response
    } catch (e) {
      return null
    }
  }

  async getProfile(id: number): Promise<any> {
    try {
      const response = await fetch(`${config.api.memberUrl}/profile/${id}`)
      return response
    } catch (e) {
      return null
    }
  }
}

export default new MemberProfileFetch()
