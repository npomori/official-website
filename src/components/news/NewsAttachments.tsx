import { formatFileSize, getFileEmoji } from '@/helpers/file'
import type { NewsAttachment } from '@/types/news'
import React from 'react'

interface NewsAttachmentsProps {
  newsId: number
  attachments: NewsAttachment[]
  className?: string
}

const NewsAttachments: React.FC<NewsAttachmentsProps> = ({
  newsId,
  attachments,
  className = ''
}) => {
  if (!attachments || attachments.length === 0) {
    return null
  }

  const getFileIcon = (filename: string): string => {
    return getFileEmoji(filename)
  }

  const handleDownload = async (attachment: NewsAttachment) => {
    try {
      const response = await fetch(`/api/news/download/${newsId}/${attachment.filename}`)

      if (!response.ok) {
        throw new Error('ファイルのダウンロードに失敗しました')
      }

      // ファイルをダウンロード
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('ファイルのダウンロードに失敗しました')
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-sm font-medium text-gray-700">添付ファイル</h4>
      <div className="space-y-1">
        {attachments.map((attachment, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg bg-gray-50 p-2 transition-colors hover:bg-gray-100"
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getFileIcon(attachment.name)}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
              </div>
            </div>
            <button
              onClick={() => handleDownload(attachment)}
              className="rounded bg-blue-500 px-3 py-1 text-xs text-white transition-colors hover:bg-blue-600"
            >
              ダウンロード
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default NewsAttachments
