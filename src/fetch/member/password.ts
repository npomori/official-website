import config from '@/config/config.json'
import { BaseApiFetch } from '../base'

interface PasswordUpdateRequest {
  currentPassword: string
  newPassword: string
}

interface PasswordUpdateResponse {
  message: string
}

class MemberPasswordFetch extends BaseApiFetch {
  async updatePassword(id: number, data: PasswordUpdateRequest) {
    return this.requestWithJson<PasswordUpdateResponse>(
      `${config.api.memberUrl}/password/${id}`,
      data,
      'PUT'
    )
  }
}

export default new MemberPasswordFetch()
