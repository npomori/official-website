/**
 * 日付を指定されたフォーマットに変換します
 * @param date 変換する日付
 * @param isAllDay 終日イベントかどうか
 * @returns フォーマットされた日付文字列
 */
export const formatDate = (date: Date, isAllDay: boolean): string => {
  const formatted = new Date(date).toLocaleString('sv-SE', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
  return isAllDay ? formatted.split(' ')[0]! : formatted.replace(' ', 'T')
}
