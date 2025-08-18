import config from '@/config/config.json'

class CommentFetch {
  async getComments(eventId: number): Promise<Response> {
    const response = await fetch(`${config.api.rootUrl}/comment?eventId=${eventId}`)
    return response
  }
}

export default new CommentFetch()
