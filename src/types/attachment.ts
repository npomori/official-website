/**
 * 添付ファイルの共通型
 * Location、News などで使用
 */
export interface Attachment {
  /** 元のファイル名(ユーザーがアップロードしたファイル名、表示用) */
  name: string
  /** サーバーに保存されたファイル名(UUID等、ダウンロードAPI用) */
  filename: string
  /** ファイルサイズ(バイト数) */
  size: number
}

/**
 * 画像添付ファイルの型（ギャラリー画像用）
 * Attachment を拡張し、キャプションを追加
 */
export interface ImageAttachment extends Attachment {
  /** 画像のキャプション（説明文） */
  caption?: string
}
