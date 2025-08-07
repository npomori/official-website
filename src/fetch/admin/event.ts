import config from '@/config/config.json'
import type { EventAdminRequest } from '@/types/event'

class AdminEventFetch {
  async addEvent(params: EventAdminRequest): Promise<any> {
    try {
      const response = await fetch(`${config.api.adminUrl}/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })
      return response
    } catch (e) {
      return null
    }
  }

  async removeEvent(id: number): Promise<any> {
    try {
      const response = await fetch(`${config.api.adminUrl}/event/${id}`, {
        method: 'DELETE'
      })
      return response
    } catch (e) {
      return null
    }
  }

  async updateEvent(id: number, params: EventAdminRequest): Promise<any> {
    try {
      const response = await fetch(`${config.api.adminUrl}/event/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })
      return response
    } catch (e) {
      return null
    }
  }

  async getEvent(id: number): Promise<any> {
    try {
      const response = await fetch(`${config.api.adminUrl}/event/${id}`)
      return response
    } catch (e) {
      return null
    }
  }

  async getEvents(): Promise<any> {
    try {
      const response = await fetch(`${config.api.adminUrl}/event`)
      return response
    } catch (e) {
      return null
    }
  }
}

export default new AdminEventFetch()
