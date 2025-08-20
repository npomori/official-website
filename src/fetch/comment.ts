import config from '@/config/config.json'
import { BaseApiFetch } from './base'

interface Comment {
  id: number
  content: string
  eventId: number
  creatorId: number
  createdAt: string
  updatedAt: string
  creator: {
    id: number
    name: string
    avatar: string | null
  }
}

class CommentFetch extends BaseApiFetch {
  async getComments(eventId: number) {
    return this.request<Comment[]>(`${config.api.rootUrl}/comment?eventId=${eventId}`)
  }
}

export default new CommentFetch()
