import locationsData from './locations.json'

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
  gallery: string[]
  activityDetails?: string
  fieldCharacteristics?: string
  meetingPoint?: MeetingPoint
  participationFee?: string
  upcomingDates?: string[]
  notes?: string
  other?: string
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

// JSONファイルからデータを取得し、型を適切に変換
export const allLocations: LocationData[] = locationsData.map((location) => ({
  ...location,
  position: location.position as [number, number],
  type: location.type as 'regular' | 'activity'
}))

// 定例活動地のみを取得する関数
export const getRegularLocations = (): LocationData[] => {
  return allLocations.filter((location) => location.type === 'regular')
}

// その他の活動地のみを取得する関数
export const getOtherLocations = (): LocationData[] => {
  return allLocations.filter((location) => location.type === 'activity')
}

// 名前で活動地を検索する関数
export const findLocationByName = (name: string): LocationData | undefined => {
  return allLocations.find((location) => location.name === name)
}

// IDで活動地を検索する関数
export const findLocationById = (id: string): LocationData | undefined => {
  return allLocations.find((location) => location.id === id)
}
