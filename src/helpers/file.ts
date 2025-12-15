/**
 * ファイル関連のヘルパー関数
 */

/**
 * バイト数を人間が読みやすい形式に変換
 * @param bytes ファイルサイズ(バイト数)
 * @returns フォーマット済みのファイルサイズ文字列
 * @example
 * formatFileSize(512) // "512 B"
 * formatFileSize(1536) // "1.5 KB"
 * formatFileSize(1258291) // "1.2 MB"
 * formatFileSize(1610612736) // "1.5 GB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }
}

/**
 * ファイル名から拡張子を取得(小文字)
 * @param filename ファイル名
 * @returns 拡張子(小文字)、拡張子がない場合は空文字列
 * @example
 * getFileExtension("document.pdf") // "pdf"
 * getFileExtension("image.PNG") // "png"
 * getFileExtension("archive.tar.gz") // "gz"
 */
export function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.')
  return parts.length > 1 ? parts[parts.length - 1] || '' : ''
}

/**
 * ファイルの拡張子に応じた SVG パス文字列を返す
 * @param filename ファイル名
 * @returns SVG path 文字列
 */
export function getFileIconPath(filename: string): string {
  const ext = getFileExtension(filename)

  // PDF
  if (ext === 'pdf') {
    return 'M7 18h10v-1H7v1zM17 14H7v-1h10v1zM7 10h10V9H7v1zM6 2h8l6 6v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm7 7V3.5L18.5 9H13z'
  }

  // Word
  if (['doc', 'docx'].includes(ext)) {
    return 'M6 2h8l6 6v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm7 7V3.5L18.5 9H13zM8 11h8v2H8v-2zm0 4h8v2H8v-2z'
  }

  // Excel
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return 'M6 2h8l6 6v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm7 7V3.5L18.5 9H13zM8 11h3v2H8v-2zm5 0h3v2h-3v-2zM8 15h3v2H8v-2zm5 0h3v2h-3v-2z'
  }

  // PowerPoint
  if (['ppt', 'pptx'].includes(ext)) {
    return 'M6 2h8l6 6v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm7 7V3.5L18.5 9H13zM8 11h8v6H8v-6zm1 1v4h6v-4H9z'
  }

  // 画像
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'
  }

  // 動画
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) {
    return 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z'
  }

  // 音声
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
    return 'M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z'
  }

  // 圧縮ファイル
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return 'M6 2h8l6 6v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm7 7V3.5L18.5 9H13zM10 11h4v2h-4v-2zm0 4h4v2h-4v-2z'
  }

  // テキスト
  if (['txt', 'md', 'log'].includes(ext)) {
    return 'M6 2h8l6 6v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm7 7V3.5L18.5 9H13zM8 11h8v2H8v-2zm0 4h8v2H8v-2z'
  }

  // デフォルト(汎用ファイル)
  return 'M6 2h8l6 6v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm7 7V3.5L18.5 9H13z'
}

/**
 * ファイル名から絵文字アイコンを取得(簡易版、後方互換用)
 * @param filename ファイル名
 * @returns 絵文字アイコン
 */
export function getFileEmoji(filename: string): string {
  const ext = getFileExtension(filename)

  if (ext === 'pdf') {
    return '📄'
  } else if (['doc', 'docx'].includes(ext)) {
    return '📝'
  } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return '📊'
  } else if (['ppt', 'pptx'].includes(ext)) {
    return '📊'
  } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
    return '🖼️'
  } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext)) {
    return '🎥'
  } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
    return '🎵'
  } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return '📦'
  } else {
    return '📎'
  }
}
