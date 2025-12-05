/**
 * Location型定義
 */

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
  gallery: string[]
  activityDetails?: string
  fieldCharacteristics?: string
  meetingPoint?: MeetingPoint
  participationFee?: string
  upcomingDates?: string[]
  notes?: string
  other?: string
  attachments?: Array<{
    name: string
    url: string
    size?: string
  }>
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
  detailInfo?: DetailInfo
}
