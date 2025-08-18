import config from '@/config/config.json'

class MemberPasswordFetch {
  async updatePassword(
    id: number,
    data: { currentPassword: string; newPassword: string }
  ): Promise<Response> {
    const response = await fetch(`${config.api.memberUrl}/password/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return response
  }
}

export default new MemberPasswordFetch()
