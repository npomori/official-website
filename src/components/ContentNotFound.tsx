import React from 'react'

export type ContentNotFoundProps = {
  title?: string
  descriptionLines?: string[]
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
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
          <h1 className="mb-4 text-4xl font-bold text-gray-800">{title}</h1>
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

      {/* アクションボタン（左: ホーム/緑, 右: 追加/グレー） */}
      <div className="flex flex-col justify-center gap-4 sm:flex-row">
        <a
          href={secondaryHref}
          className="rounded-lg bg-green-600 px-8 py-3 text-center font-medium text-white transition-colors hover:bg-green-700"
        >
          {secondaryLabel}
        </a>
        {primaryHref && (
          <a
            href={primaryHref}
            className="rounded-lg border border-gray-300 px-8 py-3 text-center font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
          >
            {primaryLabel}
          </a>
        )}
      </div>
    </div>
  )
}

export default ContentNotFound
