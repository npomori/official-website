import config from '@/config/config.json'
import { BaseApiFetch } from '../base'

interface CommentRequest {
  eventId: number
  content: string
}

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

class MemberCommentFetch extends BaseApiFetch {
  async getComments(eventId: number) {
    return this.request<Comment[]>(`${config.api.memberUrl}/comment?eventId=${eventId}`)
  }

  async addComment(params: CommentRequest) {
    return this.requestWithJson<Comment>(`${config.api.memberUrl}/comment`, params, 'POST')
  }

  async deleteComment(commentId: string) {
    return this.request<Comment>(`${config.api.memberUrl}/comment/${commentId}`, {
      method: 'DELETE'
    })
  }
}

export default new MemberCommentFetch()
