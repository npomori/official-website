import config from '@/config/config.json'
import type { EventAdminRequest, EventAdminResponse } from '@/types/event'
import { BaseApiFetch } from '../base'

class AdminEventFetch extends BaseApiFetch {
  async addEvent(params: EventAdminRequest) {
    return this.requestWithJson<EventAdminResponse>(`${config.api.adminUrl}/event`, params, 'POST')
  }

  async removeEvent(id: number) {
    return this.request(`${config.api.adminUrl}/event/${id}`, { method: 'DELETE' })
  }

  async updateEvent(id: number, params: EventAdminRequest) {
    return this.requestWithJson<EventAdminResponse>(
      `${config.api.adminUrl}/event/${id}`,
      params,
      'PUT'
    )
  }

  async getEvent(id: number) {
    return this.request<EventAdminResponse>(`${config.api.adminUrl}/event/${id}`)
  }

  async getEvents() {
    return this.request<EventAdminResponse[]>(`${config.api.adminUrl}/event`)
  }
}

export default new AdminEventFetch()
