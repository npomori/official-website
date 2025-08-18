import config from '@/config/config.json'

class EventFetch {
  async getEvent(id: number): Promise<Response> {
    const response = await fetch(`${config.api.rootUrl}/event/${id}`)
    return response
  }

  async getUpcomingEvents(limit?: number): Promise<Response> {
    const url = limit
      ? `${config.api.rootUrl}/event/upcoming?limit=${limit}`
      : `${config.api.rootUrl}/event/upcoming`
    const response = await fetch(url)
    return response
    // if (!response.ok) {
    //   throw new Error('イベントの取得に失敗しました')
    // }
    // return await response.json()
  }
}
export default new EventFetch()
