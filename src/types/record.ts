export interface Record {
  id: number
  location: string
  datetime: string
  eventDate: Date
  weather: string
  participants: string
  reporter: string
  content: string
  nearMiss?: string | null
  equipment?: string | null
  remarks?: string | null
  categories?: string[] | null
  images?: string[] | null
  createdAt: Date
  updatedAt: Date
  creator: {
    id: number
    name: string
    email: string
  }
}

export interface CreateRecordData {
  location: string
  datetime: string
  eventDate: Date
  weather: string
  participants: string
  reporter: string
  content: string
  nearMiss?: string
  equipment?: string
  remarks?: string
  categories?: string[]
  images?: string[]
  creatorId: number
}

export interface UpdateRecordData {
  location?: string
  datetime?: string
  eventDate?: Date
  weather?: string
  participants?: string
  reporter?: string
  content?: string
  nearMiss?: string
  equipment?: string
  remarks?: string
  categories?: string[]
  images?: string[]
}

export interface PublicRecord {
  id: number
  location: string
  datetime: string
  eventDate: Date
  weather: string
  participants: string
  reporter: string
  content: string
  nearMiss?: string | null
  equipment?: string | null
  remarks?: string | null
  categories?: string[] | null
  images?: string[] | null
  createdAt: Date
  updatedAt: Date
  creator: {
    id: number
    name: string
    email: string
  }
}

// 記録APIレスポンス型定義
export interface RecordResponse {
  records: Record[]
  pagination: {
    currentPage: number
    itemsPerPage: number
    totalCount: number
    totalPages: number
  }
}

export interface RecordDetailResponse {
  record: Record
}

export interface RecordCreateResponse {
  record: Record
}

export interface RecordUpdateResponse {
  record: Record
}

export interface RecordDeleteResponse {
  message: string
}

// Admin用の型定義
export interface RecordAdminRequest {
  location: string
  datetime: string
  eventDate?: Date
  weather: string
  participants: string
  reporter: string
  content: string
  nearMiss?: string | undefined
  equipment?: string | undefined
  remarks?: string | undefined
  categories?: string[] | undefined
  images?: string[] | undefined
}

export interface RecordCreateRequest {
  dateForFilename: string
  data: {
    location: string
    datetime: string
    weather: string
    participants: string
    reporter: string
    content: string
    nearMiss?: string | undefined
    equipment?: string | undefined
    remarks?: string | undefined
    categories?: string[] | undefined
    images?: string[] | undefined
  }
}

export interface RecordCreateWithImagesRequest {
  dateForFilename: string
  data: {
    location: string
    datetime: string
    weather: string
    participants: string
    reporter: string
    content: string
    nearMiss?: string | undefined
    equipment?: string | undefined
    remarks?: string | undefined
    categories?: string[] | undefined
  }
  images?: File[]
}

export interface RecordUpdateWithImagesRequest {
  data: {
    location: string
    datetime: string
    weather: string
    participants: string
    reporter: string
    content: string
    nearMiss?: string | undefined
    equipment?: string | undefined
    remarks?: string | undefined
    categories?: string[] | undefined
    images?: string[] | undefined
  }
  images?: File[]
}

export interface RecordUploadResponse {
  success: boolean
  files: string[]
  message?: string
}
