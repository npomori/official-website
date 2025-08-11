import type { NewsAttachment } from '@/types/news'
import React from 'react'

interface NewsAttachmentsProps {
  attachments: NewsAttachment[]
  className?: string
}

const NewsAttachments: React.FC<NewsAttachmentsProps> = ({ attachments, className = '' }) => {
  if (!attachments || attachments.length === 0) {
    return null
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string): string => {
    if (mimeType.includes('pdf')) {
      return '📄'
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return '📝'
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return '📊'
    } else if (mimeType.includes('image')) {
      return '🖼️'
    } else {
      return '📎'
    }
  }

  const handleDownload = async (attachment: NewsAttachment) => {
    try {
      const response = await fetch(`/api/admin/news/download/${attachment.serverName}`)

      if (!response.ok) {
        throw new Error('ファイルのダウンロードに失敗しました')
      }

      // ファイルをダウンロード
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = attachment.originalName
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
              <span className="text-lg">{getFileIcon(attachment.mimeType)}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{attachment.originalName}</p>
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
