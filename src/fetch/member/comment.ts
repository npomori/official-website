import config from '@/config/config.json'

interface CommentRequest {
  eventId: number
  content: string
}

class MemberCommentFetch {
  async getComments(eventId: number): Promise<any> {
    try {
      const response = await fetch(`${config.api.memberUrl}/comment?eventId=${eventId}`)
      return response
    } catch (e) {
      return null
    }
  }

  async addComment(params: CommentRequest): Promise<any> {
    try {
      const response = await fetch(`${config.api.memberUrl}/comment`, {
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

  async deleteComment(commentId: string): Promise<any> {
    try {
      const response = await fetch(`${config.api.memberUrl}/comment/${commentId}`, {
        method: 'DELETE'
      })
      return response
    } catch (e) {
      return null
    }
  }
}

export default new MemberCommentFetch()
