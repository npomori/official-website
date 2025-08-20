import config from '@/config/config.json'
import type { UserProfile } from '@/types/profile'
import { BaseApiFetch } from '../base'

class MemberProfileFetch extends BaseApiFetch {
  async updateProfile(id: number, params: FormData) {
    return this.requestWithFormData<UserProfile>(
      `${config.api.memberUrl}/profile/${id}`,
      params,
      'PUT'
    )
  }

  async getProfile(id: number) {
    return this.request<UserProfile>(`${config.api.memberUrl}/profile/${id}`)
  }
}

export default new MemberProfileFetch()
