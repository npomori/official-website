import config from '@/config/config.json'
import type { EventDetailResponse, EventResponse } from '@/types/event'
import { BaseApiFetch } from './base'

class EventFetch extends BaseApiFetch {
  async getEvent(id: number) {
    return this.request<EventDetailResponse>(`${config.api.rootUrl}/event/${id}`)
  }

  async getEvents(start: string, end: string) {
    return this.request<EventResponse[]>(`${config.api.rootUrl}/event?start=${start}&end=${end}`)
  }
}

export default new EventFetch()
