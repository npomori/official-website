/**
 * Location型定義
 */

import type { Attachment, ImageAttachment } from './attachment'

export interface MeetingPoint {
  address: string
  time: string
  mapUrl?: string
  additionalInfo?: string
}

export interface DetailInfo {
  access: string
  facilities: string
  schedule: string
  requirements: string
  contact: string
  organizer?: string
  startedDate?: string
  gallery: ImageAttachment[]
  activityDetails?: string
  fieldCharacteristics?: string
  meetingPoint?: MeetingPoint
  participationFee?: string
  upcomingDates?: string[]
  notes?: string
  other?: string
  attachments?: Attachment[]
}

export interface LocationData {
  id: string
  name: string
  position: [number, number]
  type: 'regular' | 'activity'
  activities?: string
  image?: string
  address?: string
  hasDetail?: boolean
  detailInfo: DetailInfo | undefined
}
