import React from 'react'

export type ContentNotFoundProps = {
  title?: string
  descriptionLines?: string[]
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
  /**
   * true: 右側（primary）を強調（緑）/ 左側（secondary）はグレー
   * false: 左側（secondary）を強調（緑）/ 右側（primary）はグレー
   */
  primaryEmphasis?: boolean
  className?: string
}

const ContentNotFound: React.FC<ContentNotFoundProps> = ({
  title = 'コンテンツが見つかりません',
  descriptionLines = [
    'お探しのコンテンツは存在しないか、',
    '移動または削除された可能性があります。'
  ],
  // 追加ボタン（任意・右側・グレー）
  primaryHref,
  primaryLabel = '一覧に戻る',
  // デフォルトはホーム（左側・緑）
  secondaryHref = '/',
  secondaryLabel = 'ホームに戻る',
  primaryEmphasis = false,
  className
}) => {
  return (
    <div className={['mx-auto max-w-4xl', className].filter(Boolean).join(' ')}>
      {/* メインコンテンツ */}
      <div className="mb-24 text-center">
        <div className="mb-6">
          <div className="mb-1 inline-flex h-32 w-32 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-800">{title}</h1>
          <p className="mx-auto max-w-md text-lg text-gray-600">
            {descriptionLines.map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < descriptionLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        </div>
      </div>

      {/* アクションボタン（強調側を緑に切替可能） */}
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <a
          href={secondaryHref}
          className={[
            'rounded-lg px-8 py-3 text-center font-medium transition-colors',
            primaryEmphasis
              ? 'border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
              : 'bg-green-600 text-white hover:bg-green-700'
          ].join(' ')}
        >
          {secondaryLabel}
        </a>
        {primaryHref && (
          <a
            href={primaryHref}
            className={[
              'rounded-lg px-8 py-3 text-center font-medium transition-colors',
              primaryEmphasis
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
            ].join(' ')}
          >
            {primaryLabel}
          </a>
        )}
      </div>
    </div>
  )
}

export default ContentNotFound
