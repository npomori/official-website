import config from '@/config/config.json'

class MemberProfileFetch {
  async updateProfile(id: number, params: FormData): Promise<Response> {
    const response = await fetch(`${config.api.memberUrl}/profile/${id}`, {
      method: 'PUT',
      body: params
    })
    return response
  }

  async getProfile(id: number): Promise<Response> {
    const response = await fetch(`${config.api.memberUrl}/profile/${id}`)
    return response
  }
}

export default new MemberProfileFetch()
