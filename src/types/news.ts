export interface NewsAttachment {
  originalName: string
  filename: string
}

export interface News {
  id: number
  title: string
  content: string
  date: Date | string
  categories?: string[] | null
  priority?: string | null
  attachments?: NewsAttachment[] | null
  author: string
  status: string
  creatorId: number
  createdAt: Date | string
  updatedAt: Date | string
  downloadStats?: {
    [filename: string]: {
      count: number
      firstDownloadAt?: string
      lastDownloadAt?: string
    }
  } | null
  creator: {
    id: number
    name: string
  }
}

export interface CreateNewsData {
  title: string
  content: string
  date: Date
  categories?: string[]
  priority?: string
  attachments?: NewsAttachment[]
  author: string
  status?: string
  creatorId: number
}

export interface UpdateNewsData {
  title?: string
  content?: string
  date?: Date
  categories?: string[]
  priority?: string
  attachments?: NewsAttachment[]
  author?: string
  status?: string
}

export interface PublicNews {
  id: number
  title: string
  content: string
  date: Date | string
  categories?: string[] | null
  priority?: string | null
  attachments?: NewsAttachment[] | null
  author: string
}
