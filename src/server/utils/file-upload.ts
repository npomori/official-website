import { existsSync } from 'fs'
import { mkdir, unlink, writeFile } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

interface UploadedFile {
  originalName: string
  filename: string
  size: number
}

export default class FileUploader {
  private uploadDir: string

  constructor(uploadDir: string) {
    this.uploadDir = uploadDir
  }

  /**
   * ファイルをアップロードして保存
   */
  async uploadFile(
    file: any, // FormDataのFileオブジェクト
    subDirectory?: string
  ): Promise<UploadedFile> {
    try {
      // アップロードディレクトリのパスを構築
      const uploadPath = subDirectory ? join(this.uploadDir, subDirectory) : this.uploadDir

      // ディレクトリが存在しない場合は作成
      if (!existsSync(uploadPath)) {
        await mkdir(uploadPath, { recursive: true })
      }

      // サーバ上のファイル名を生成（UUID + 拡張子）
      const fileExtension = this.getFileExtension(file.name)
      const serverFileName = `${this.generateUniqueFileName()}${fileExtension}`
      const filePath = join(uploadPath, serverFileName)

      // ファイルをバッファに変換
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // ファイルを保存
      await writeFile(filePath, buffer)

      return {
        originalName: file.name,
        filename: serverFileName,
        size: file.size // ファイルサイズ(バイト数)を追加
      }
    } catch (error) {
      console.error('File upload error:', error)
      throw new Error('ファイルのアップロードに失敗しました')
    }
  }

  /**
   * 複数ファイルをアップロード
   */
  async uploadFiles(files: File[], subDirectory?: string): Promise<UploadedFile[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, subDirectory))
    return Promise.all(uploadPromises)
  }

  /**
   * ファイル拡張子を取得
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.')
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : ''
  }

  /**
   * ユニークなファイル名を生成（UUIDベース）
   */
  private generateUniqueFileName(): string {
    //return `file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    return uuidv4()
  }

  /**
   * ファイルサイズを検証
   */
  validateFileSize(file: File, maxSizeInBytes: number): boolean {
    return file.size <= maxSizeInBytes
  }

  /**
   * ファイルタイプを検証
   */
  validateFileType(file: { type: string }, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type)
  }

  /**
   * ファイル数を検証
   */
  validateFileCount(files: File[], maxFiles: number): boolean {
    return files.length <= maxFiles
  }

  /**
   * ファイルを削除
   */
  async deleteFile(filename: string, subDirectory?: string): Promise<boolean> {
    try {
      const filePath = subDirectory
        ? join(this.uploadDir, subDirectory, filename)
        : join(this.uploadDir, filename)

      if (existsSync(filePath)) {
        await unlink(filePath)
        return true
      }
      return false
    } catch (error) {
      console.error('File deletion error:', error)
      return false
    }
  }

  /**
   * 複数ファイルを削除
   */
  async deleteFiles(filenames: string[], subDirectory?: string): Promise<boolean[]> {
    const deletePromises = filenames.map((filename) => this.deleteFile(filename, subDirectory))
    return Promise.all(deletePromises)
  }
}

/**
 * お知らせ用のファイルアップローダー
 */
//export const newsFileUploader = new FileUploader('public/uploads/news')
