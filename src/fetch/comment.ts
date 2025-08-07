import config from '@/config/config.json'

class CommentFetch {
  async getComments(eventId: number): Promise<any> {
    try {
      const response = await fetch(`${config.api.rootUrl}/comment?eventId=${eventId}`)
      return response
    } catch (e) {
      return null
    }
  }
}

export default new CommentFetch()
