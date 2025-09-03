export interface ArticleAttachment {
  originalName: string
  filename: string
}

export interface Article {
  id: number
  title: string
  content: string
  featuredImage?: string | null
  images?: string[] | null
  attachments?: ArticleAttachment[] | null
  tags?: string[] | null
  category?: string | null
  status: string
  publishedAt?: Date | string | null
  seoDescription?: string | null
  seoKeywords?: string | null
  isMemberOnly: boolean
  viewCount: number
  downloadStats?: {
    [filename: string]: {
      count: number
      firstDownloadAt?: string
      lastDownloadAt?: string
    }
  } | null
  creatorId: number
  createdAt: Date | string
  updatedAt: Date | string
  creator: {
    id: number
    name: string
  }
}

export interface CreateArticleData {
  title: string
  content: string
  featuredImage?: string
  images?: string[]
  attachments?: ArticleAttachment[]
  tags?: string[]
  category?: string
  status?: string
  publishedAt?: Date
  seoDescription?: string
  seoKeywords?: string
  isMemberOnly?: boolean
  creatorId: number
}

export interface UpdateArticleData {
  title?: string
  content?: string
  featuredImage?: string
  images?: string[]
  attachments?: ArticleAttachment[]
  tags?: string[]
  category?: string
  status?: string
  publishedAt?: Date
  seoDescription?: string
  seoKeywords?: string
  isMemberOnly?: boolean
}

export interface PublicArticle {
  id: number
  title: string
  content: string
  featuredImage?: string | null
  images?: string[] | null
  attachments?: ArticleAttachment[] | null
  tags?: string[] | null
  category?: string | null
  publishedAt?: Date | string | null
  seoDescription?: string | null
  seoKeywords?: string | null
  isMemberOnly: boolean
  viewCount: number
  creator: {
    id: number
    name: string
  }
}

// 記事APIレスポンス型定義
export interface ArticleListResponse {
  articles: Article[]
  pagination: {
    currentPage: number
    itemsPerPage: number
    totalCount: number
    totalPages: number
  }
}

export interface ArticleDetailResponse {
  article: Article
}

export interface ArticleCreateResponse {
  article: Article
}

export interface ArticleUpdateResponse {
  article: Article
}

export interface ArticleDeleteResponse {
  message: string
}
