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
