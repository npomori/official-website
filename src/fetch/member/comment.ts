import config from '@/config/config.json'

interface CommentRequest {
  eventId: number
  content: string
}

class MemberCommentFetch {
  async getComments(eventId: number): Promise<Response> {
    const response = await fetch(`${config.api.memberUrl}/comment?eventId=${eventId}`)
    return response
  }

  async addComment(params: CommentRequest): Promise<Response> {
    const response = await fetch(`${config.api.memberUrl}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })
    return response
  }

  async deleteComment(commentId: string): Promise<Response> {
    const response = await fetch(`${config.api.memberUrl}/comment/${commentId}`, {
      method: 'DELETE'
    })
    return response
  }
}

export default new MemberCommentFetch()
