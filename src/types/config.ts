import configData from '@/config/config.json'

// 設定ファイルの型定義
interface SiteConfig {
  title: string
  logo: string
  favicon: string
  comments: {
    enabled: boolean
  }
}

interface AvatarUploadConfig {
  url: string
  directory: string
  size: {
    width: number
    height: number
  }
  default: string
}

interface RecordUploadConfig {
  enabled: boolean
  url: string
  directory: string
  maxFiles: number
  maxFileSize: number
  allowedTypes: string[]
  maxSize: {
    width: number
    height: number
  }
  quality: number
  thumbnail: {
    width: number
    height: number
  }
}

interface NewsUploadConfig {
  enabled: boolean
  url: string
  directory: string
  maxFiles: number
  maxFileSize: number
  allowedTypes: string[]
}

interface UploadConfig {
  avatar: AvatarUploadConfig
  record: RecordUploadConfig
  news: NewsUploadConfig
}

interface ApiConfig {
  rootUrl: string
  adminUrl: string
  memberUrl: string
}

interface DashboardConfig {
  recentActivities: {
    admin: number
    user: number
  }
}

interface HomeConfig {
  news: {
    itemsPerPage: number
  }
  events: {
    itemsPerPage: number
  }
}

interface PaginationConfig {
  recordList: {
    itemsPerPage: number
  }
  newsList: {
    itemsPerPage: number
  }
}

interface RecordContentConfig {
  editDays: number
}

interface NewsContentConfig {
  editDays: number
  defaultAuthor?: string
}

interface ArticleContentConfig {
  headingShift?: number
}

interface ContentConfig {
  record: RecordContentConfig
  news: NewsContentConfig
  article?: ArticleContentConfig
}

export interface Config {
  site: SiteConfig
  upload: UploadConfig
  api: ApiConfig
  dashboard: DashboardConfig
  home: HomeConfig
  pagination: PaginationConfig
  content: ContentConfig
}

// 設定データを型安全にキャスト
const config = configData as Config

export default config

// 便利な関数をエクスポート
export const getRecordUploadConfig = () => config.upload.record
export const getAvatarUploadConfig = () => config.upload.avatar
export const getNewsUploadConfig = () => config.upload.news
export const getSiteConfig = () => config.site
export const getConfig = () => config
export const getArticleContentConfig = () => config.content.article
