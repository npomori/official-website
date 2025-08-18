import config from '@/config/config.json'
import type { EventAdminRequest } from '@/types/event'

class AdminEventFetch {
  async addEvent(params: EventAdminRequest): Promise<Response> {
    const response = await fetch(`${config.api.adminUrl}/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
    return response
  }

  async removeEvent(id: number): Promise<Response> {
    const response = await fetch(`${config.api.adminUrl}/event/${id}`, {
      method: 'DELETE'
    })
    return response
  }

  async updateEvent(id: number, params: EventAdminRequest): Promise<Response> {
    const response = await fetch(`${config.api.adminUrl}/event/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
    return response
  }

  async getEvent(id: number): Promise<Response> {
    const response = await fetch(`${config.api.adminUrl}/event/${id}`)
    return response
  }

  async getEvents(): Promise<Response> {
    const response = await fetch(`${config.api.adminUrl}/event`)
    return response
  }
}

export default new AdminEventFetch()
