import Button from '@/components/base/Button'
import Spinner from '@/components/base/Spinner'
import SpinnerOverlay from '@/components/base/SpinnerOverlay'
import adminArticleFetch from '@/fetch/admin/article'
import React, { useEffect, useState } from 'react'

// --------------------------------------------------
// 選択可能なコンポーネント定義
// --------------------------------------------------
export type SelectableComponentId = 'MDXImage' | 'ImageGallery' | 'ImageTextLayout' | 'InfoCard'

export type SelectableComponent = {
  id: SelectableComponentId
  label: string
  description?: string
}

export const selectableComponents: SelectableComponent[] = [
  { id: 'MDXImage', label: 'MDXImage', description: '単一画像: サイズ/配置/キャプション' },
  { id: 'ImageGallery', label: 'ImageGallery', description: '複数画像のギャラリー' },
  { id: 'ImageTextLayout', label: 'ImageTextLayout', description: '画像 + テキスト2カラム' },
  { id: 'InfoCard', label: 'InfoCard', description: '情報カード (タイトル/説明/色)' }
]

// --------------------------------------------------
// 共通: 画像入力 (簡易版)
// --------------------------------------------------
function UploadImageInput({
  label = '画像',
  value,
  onChange,
  onUploaded
}: {
  label?: string
  value: string
  onChange: (url: string) => void
  onUploaded?: (url: string) => void // アップロード直後のURL通知（未確定リスト登録用）
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    if (localPreview) URL.revokeObjectURL(localPreview)
    const objectUrl = URL.createObjectURL(file)
    setLocalPreview(objectUrl)
    try {
      const { url } = await adminArticleFetch.uploadImage(file)
      onChange(url)
      onUploaded?.(url)
      URL.revokeObjectURL(objectUrl)
      setLocalPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
    }
  }

  function handleClear() {
    if (localPreview) URL.revokeObjectURL(localPreview)
    setLocalPreview(null)
    onChange('')
  }

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  return (
    <div className="space-y-1">
      <label className="mb-1 block text-base font-medium text-gray-900">{label}</label>
      {/* 一体型入力グループ (テキストフィールド + ボタン) */}
      <div className="group relative flex w-full items-stretch">
        <input
          type="text"
          className="w-full cursor-default rounded-l-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base transition outline-none focus:z-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
          placeholder="ファイル選択で自動入力されます"
          value={value}
          readOnly
          title="このフィールドは直接編集できません (画像を選択してください)"
        />
        <label
          className="inline-flex min-w-[120px] cursor-pointer items-center justify-center rounded-r-lg border border-l-0 border-gray-300 bg-gray-600 px-6 py-2 text-base font-medium text-white shadow-sm transition select-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-0 hover:bg-gray-700"
          aria-label="画像ファイルを選択"
        >
          選択
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
            tabIndex={-1}
          />
        </label>
      </div>
      {uploading && (
        <div className="text-base text-gray-600">
          <Spinner size="sm" label="アップロード中…" />
        </div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {(localPreview || value) && (
        <div className="relative mt-2 inline-block h-24 w-24">
          <img
            src={localPreview || value}
            alt="preview"
            className={`h-full w-full rounded-lg object-cover shadow-md ${uploading ? 'opacity-70' : ''}`}
          />
          <button
            type="button"
            onClick={handleClear}
            className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-700 text-white shadow hover:bg-gray-800"
            aria-label="画像をクリア"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {uploading && (
            <div className="absolute inset-0 rounded-lg">
              <SpinnerOverlay
                show
                className="rounded-lg"
                backdropClassName="bg-black/40"
                hideText
                spinnerSize="sm"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// --------------------------------------------------
// フォーム: MDXImage
// --------------------------------------------------
export interface MDXImageValues {
  src: string
  alt: string
  size: 'small' | 'medium' | 'large' | 'full'
  align: 'left' | 'center' | 'right'
  caption?: string
  rounded?: boolean
  shadow?: boolean
}

function MDXImageForm({
  initial,
  onValuesChange,
  onTempUploaded
}: {
  initial?: Partial<MDXImageValues>
  onValuesChange: (v: MDXImageValues) => void
  onTempUploaded: (url: string) => void
}) {
  const [src, setSrc] = useState(initial?.src || '')
  const [alt, setAlt] = useState(initial?.alt || '')
  const [size, setSize] = useState<MDXImageValues['size']>(initial?.size || 'medium')
  const [align, setAlign] = useState<MDXImageValues['align']>(initial?.align || 'center')
  const [caption, setCaption] = useState(initial?.caption || '')
  const [rounded, setRounded] = useState(initial?.rounded ?? true)
  const [shadow, setShadow] = useState(initial?.shadow ?? true)

  // 親へ変更を通知
  useEffect(() => {
    onValuesChange({ src, alt, size, align, caption, rounded, shadow })
  }, [src, alt, size, align, caption, rounded, shadow, onValuesChange])

  return (
    <div className="space-y-4">
      <UploadImageInput label="画像" value={src} onChange={setSrc} onUploaded={onTempUploaded} />
      <div>
        <label className="mb-1 block text-base font-medium text-gray-900">代替テキスト</label>
        <input
          className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:ring-2 focus:outline-none"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-base font-medium text-gray-900">サイズ</label>
          <select
            className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:ring-2 focus:outline-none"
            value={size}
            onChange={(e) => setSize(e.target.value as MDXImageValues['size'])}
          >
            <option value="small">small</option>
            <option value="medium">medium</option>
            <option value="large">large</option>
            <option value="full">full</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-base font-medium text-gray-900">配置</label>
          <select
            className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:ring-2 focus:outline-none"
            value={align}
            onChange={(e) => setAlign(e.target.value as MDXImageValues['align'])}
          >
            <option value="left">left</option>
            <option value="center">center</option>
            <option value="right">right</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-base font-medium text-gray-900">キャプション</label>
        <input
          className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:ring-2 focus:outline-none"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-6 pt-1">
        <label className="flex items-center gap-1 text-base text-gray-700">
          <input type="checkbox" checked={rounded} onChange={(e) => setRounded(e.target.checked)} />
          rounded
        </label>
        <label className="flex items-center gap-1 text-base text-gray-700">
          <input type="checkbox" checked={shadow} onChange={(e) => setShadow(e.target.checked)} />
          shadow
        </label>
      </div>
    </div>
  )
}

// --------------------------------------------------
// フォーム: ImageGallery
// --------------------------------------------------
interface ImageItem {
  src: string
  alt: string
  caption?: string
}
interface ImageGalleryValues {
  images: ImageItem[]
  columns: 1 | 2 | 3 | 4
  gap: 'sm' | 'md' | 'lg'
}

function ImageGalleryForm({
  initial,
  onValuesChange,
  onTempUploaded
}: {
  initial?: Partial<ImageGalleryValues>
  onValuesChange: (v: ImageGalleryValues) => void
  onTempUploaded: (url: string) => void
}) {
  const [images, setImages] = useState<ImageItem[]>(
    initial?.images && initial.images.length ? initial.images : [{ src: '', alt: '', caption: '' }]
  )
  const [columns, setColumns] = useState<ImageGalleryValues['columns']>(initial?.columns || 2)
  const [gap, setGap] = useState<ImageGalleryValues['gap']>(initial?.gap || 'md')

  function update(idx: number, patch: Partial<ImageItem>) {
    setImages((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }
  function add() {
    setImages((prev) => [...prev, { src: '', alt: '', caption: '' }])
  }
  function remove(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  useEffect(() => {
    onValuesChange({ images, columns, gap })
  }, [images, columns, gap, onValuesChange])

  return (
    <div className="space-y-5">
      <div className="grid gap-4">
        {images.map((img, idx) => (
          <div key={idx} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-base font-medium text-gray-600">
              画像 {idx + 1}
              <Button
                variant="error"
                size="sm"
                disabled={images.length <= 1}
                onClick={() => remove(idx)}
                text="削除"
                class="!px-2 !py-1 text-base"
              />
            </div>
            <UploadImageInput
              label="画像"
              value={img.src}
              onChange={(v) => update(idx, { src: v })}
              onUploaded={onTempUploaded}
            />
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-base font-medium text-gray-900">
                  代替テキスト
                </label>
                <input
                  className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:ring-2 focus:outline-none"
                  value={img.alt}
                  onChange={(e) => update(idx, { alt: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-base font-medium text-gray-900">
                  キャプション
                </label>
                <input
                  className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:ring-2 focus:outline-none"
                  value={img.caption || ''}
                  onChange={(e) => update(idx, { caption: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
        <Button
          variant="default"
          size="md"
          onClick={add}
          text="+ 画像を追加"
          class="border-dashed"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-base font-medium text-gray-900">列数</label>
          <select
            className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:ring-2 focus:outline-none"
            value={columns}
            onChange={(e) => setColumns(Number(e.target.value) as ImageGalleryValues['columns'])}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-base font-medium text-gray-900">余白</label>
          <select
            className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:ring-2 focus:outline-none"
            value={gap}
            onChange={(e) => setGap(e.target.value as ImageGalleryValues['gap'])}
          >
            <option value="sm">sm</option>
            <option value="md">md</option>
            <option value="lg">lg</option>
          </select>
        </div>
      </div>
    </div>
  )
}

// --------------------------------------------------
// フォーム: ImageTextLayout
// --------------------------------------------------
interface ImageTextLayoutValues {
  imageSrc: string
  imageAlt: string
  title?: string
  imagePosition: 'left' | 'right'
  childrenText?: string
}

function ImageTextLayoutForm({
  initial,
  onValuesChange,
  onTempUploaded
}: {
  initial?: Partial<ImageTextLayoutValues>
  onValuesChange: (v: ImageTextLayoutValues) => void
  onTempUploaded: (url: string) => void
}) {
  const [imageSrc, setImageSrc] = useState(initial?.imageSrc || '')
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt || '')
  const [title, setTitle] = useState(initial?.title || '')
  const [imagePosition, setImagePosition] = useState<ImageTextLayoutValues['imagePosition']>(
    initial?.imagePosition || 'left'
  )
  const [childrenText, setChildrenText] = useState(initial?.childrenText || '')

  useEffect(() => {
    onValuesChange({ imageSrc, imageAlt, title, imagePosition, childrenText })
  }, [imageSrc, imageAlt, title, imagePosition, childrenText, onValuesChange])

  return (
    <div className="space-y-4">
      <UploadImageInput
        label="画像"
        value={imageSrc}
        onChange={setImageSrc}
        onUploaded={onTempUploaded}
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-base font-medium text-gray-900">代替テキスト</label>
          <input
            className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:ring-2 focus:outline-none"
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-base font-medium text-gray-900">画像位置</label>
          <select
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={imagePosition}
            onChange={(e) =>
              setImagePosition(e.target.value as ImageTextLayoutValues['imagePosition'])
            }
          >
            <option value="left">left</option>
            <option value="right">right</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-base font-medium text-gray-900">タイトル</label>
        <input
          className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:ring-2 focus:outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-base font-medium text-gray-900">
          本文
          <span className="group relative ml-2 inline-flex items-center align-middle text-gray-500">
            <svg
              className="h-4 w-4 cursor-help"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="absolute bottom-full left-0 mb-2 hidden w-[340px] rounded-lg bg-gray-900 p-3 text-sm text-white opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100">
              <div className="space-y-2 whitespace-pre-wrap">
                <div className="font-medium">Markdown サンプル</div>
                <pre className="text-xs leading-snug whitespace-pre-wrap">{`# 見出し\n\n**強調** と *斜体*\n\n- 箇条書き1\n- 箇条書き2\n\n[リンク](https://example.com)\n\n段落の区切りは空行。`}</pre>
              </div>
              <div className="absolute -bottom-1 left-4 h-2 w-2 rotate-45 transform bg-gray-900" />
            </div>
          </span>
        </label>
        <textarea
          className="focus:border-primary-500 focus:ring-primary-500 h-32 w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-base focus:ring-2 focus:outline-none"
          value={childrenText}
          onChange={(e) => setChildrenText(e.target.value)}
        />
      </div>
    </div>
  )
}

// --------------------------------------------------
// フォーム: InfoCard
// --------------------------------------------------
interface InfoCardValues {
  title: string
  description: string
  icon?: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function InfoCardForm({
  initial,
  onValuesChange
}: {
  initial?: Partial<InfoCardValues>
  onValuesChange: (v: InfoCardValues) => void
}) {
  const [title, setTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [icon, setIcon] = useState(initial?.icon || '')
  const [color, setColor] = useState<InfoCardValues['color']>(initial?.color || 'blue')

  useEffect(() => {
    onValuesChange({ title, description, icon, color })
  }, [title, description, icon, color, onValuesChange])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-base font-medium text-gray-900">タイトル</label>
          <input
            className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:ring-2 focus:outline-none"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-base font-medium text-gray-900">アイコン</label>
          <input
            className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:ring-2 focus:outline-none"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-base font-medium text-gray-900">説明</label>
        <textarea
          className="focus:border-primary-500 focus:ring-primary-500 h-24 w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-base focus:ring-2 focus:outline-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-base font-medium text-gray-900">カラー</label>
        <select
          className="focus:border-primary-500 focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-base focus:ring-2 focus:outline-none"
          value={color}
          onChange={(e) => setColor(e.target.value as InfoCardValues['color'])}
        >
          <option value="blue">blue</option>
          <option value="green">green</option>
          <option value="purple">purple</option>
          <option value="orange">orange</option>
        </select>
      </div>
    </div>
  )
}

// --------------------------------------------------
// スニペット生成ユーティリティ
// --------------------------------------------------
function esc(str: string) {
  return (str ?? '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/"/g, '\\"')
}

export function buildMdxSnippet(
  id: SelectableComponentId,
  values: MDXImageValues | ImageGalleryValues | ImageTextLayoutValues | InfoCardValues
): string {
  switch (id) {
    case 'MDXImage': {
      const {
        src,
        alt,
        size = 'medium',
        align = 'center',
        caption = '',
        rounded = true,
        shadow = true
      } = (values as MDXImageValues) || {}
      const boolAttr = (name: string, v: boolean) => (v ? ` ${name}` : '')
      const capAttr = caption ? ` caption="${esc(caption)}"` : ''
      return `<MDXImage src="${esc(src)}" alt="${esc(alt)}" size="${size}" align="${align}"${capAttr}${boolAttr('rounded', rounded)}${boolAttr('shadow', shadow)} />`
    }
    case 'ImageGallery': {
      const { images = [], columns = 2, gap = 'md' } = (values as ImageGalleryValues) || {}
      const items = images
        // alt が未入力(空文字)でも画像を出力したいので src のみ必須に変更
        .filter((it) => it?.src)
        .map((it) => {
          const cap = it.caption ? `, caption: "${esc(it.caption)}"` : ''
          // alt が空なら空文字をそのまま保持
          return `{ src: "${esc(it.src)}", alt: "${esc(it.alt || '')}"${cap} }`
        })
        .join(', ')
      const arr = `[${items}]`
      return `<ImageGallery images={${arr}} columns={${columns}} gap="${gap}" />`
    }
    case 'ImageTextLayout': {
      const {
        imageSrc,
        imageAlt,
        title = '',
        imagePosition = 'left',
        childrenText = ''
      } = (values as ImageTextLayoutValues) || {}
      const titleAttr = title ? ` title="${esc(title)}"` : ''
      const body = childrenText ? `\n  ${childrenText.replace(/\n/g, '\n  ')}\n` : ''
      return `<ImageTextLayout imageSrc="${esc(imageSrc)}" imageAlt="${esc(imageAlt)}"${titleAttr} imagePosition="${imagePosition}">${body}</ImageTextLayout>`
    }
    case 'InfoCard': {
      const { title, description, icon = '', color = 'blue' } = (values as InfoCardValues) || {}
      const iconAttr = icon ? ` icon="${esc(icon)}"` : ''
      return `<InfoCard title="${esc(title)}" description="${esc(description)}" color="${color}"${iconAttr} />`
    }
    default:
      return ''
  }
}

// --------------------------------------------------
// 1. コンポーネント選択モーダル
// --------------------------------------------------
export function ComponentPickerModal({
  open,
  onClose,
  onSelect
}: {
  open: boolean
  onClose: () => void
  onSelect: (item: SelectableComponent) => void
}) {
  // ESCキーで閉じる
  useEffect(() => {
    if (!open) return undefined
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handle)
    return () => {
      window.removeEventListener('keydown', handle)
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        {/* ヘッダー */}
        <div className="relative mb-2 flex items-start px-6 pt-6">
          <div className="absolute top-6 right-6">
            <button
              type="button"
              aria-label="閉じる"
              onClick={onClose}
              className="focus:ring-primary-300 cursor-pointer rounded-full bg-gray-500 p-2 text-white transition-all hover:bg-gray-600 focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">コンポーネントを選択</h2>
        </div>
        {/* コンテンツ */}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {selectableComponents.map((c) => (
              <Button
                key={c.id}
                variant="default"
                size="md"
                onClick={() => onSelect(c)}
                class="group hover:border-primary-500 !h-36 min-h-[9rem] w-full flex-col items-start justify-start gap-1 border [border-width:2px] border-gray-200 bg-gradient-to-br from-white to-gray-50 !px-4 !py-3 text-left hover:border-2 hover:shadow-md"
              >
                <span className="group-hover:text-primary-600 text-base font-semibold text-gray-800 transition-colors">
                  {c.label}
                </span>
                {c.description && (
                  <span className="line-clamp-4 text-base leading-snug text-gray-600">
                    {c.description}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
        {/* フッター */}
        <div className="flex justify-end border-t border-gray-200 px-6 py-3">
          <Button
            class="min-w-[100px]"
            variant="default"
            size="md"
            onClick={onClose}
            text="閉じる"
          />
        </div>
      </div>
    </div>
  )
}

// --------------------------------------------------
// 2. コンポーネントプロパティ設定モーダル
// --------------------------------------------------
export function ComponentPropsModal({
  open,
  component,
  onClose,
  onSubmit
}: {
  open: boolean
  component: SelectableComponent | null
  onClose: () => void
  onSubmit: (mdxSnippet: string) => void
}) {
  const [localKey, setLocalKey] = useState(0)
  const [currentValues, setCurrentValues] = useState<
    MDXImageValues | ImageGalleryValues | ImageTextLayoutValues | InfoCardValues | null
  >(null)

  // 未確定アップロード管理
  const tempUploadsRef = React.useRef<Set<string>>(new Set())
  // OK で確定させた URL を記録（閉じるときに削除しないため）
  const committedRef = React.useRef<Set<string>>(new Set())

  // コンポーネント切替時に一旦未確定を削除
  useEffect(() => {
    return () => {
      void cleanupTemp()
    }
  }, [])

  async function cleanupTemp() {
    const targets = Array.from(tempUploadsRef.current).filter((u) => !committedRef.current.has(u))
    if (targets.length === 0) return
    await Promise.all(targets.map((u) => adminArticleFetch.deleteUploadedImage(u)))
    targets.forEach((u) => tempUploadsRef.current.delete(u))
  }

  // registerTemp は onUploaded から tempUploadsRef に直接追加する形に変更

  function commitUrls(urls: string[]) {
    urls.forEach((u) => committedRef.current.add(u))
  }

  // ESCキーでキャンセル扱い（閉じる）
  useEffect(() => {
    if (!open) return undefined
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handle)
    return () => {
      window.removeEventListener('keydown', handle)
    }
  }, [open, onClose])

  useEffect(() => {
    setLocalKey((k) => k + 1)
  }, [component?.id])

  if (!open || !component) return null

  async function handleOk() {
    if (!component || !currentValues) return
    // currentValues 内の URL を抽出して commit
    const urls: string[] = []
    switch (component.id) {
      case 'MDXImage':
        if ((currentValues as MDXImageValues).src) urls.push((currentValues as MDXImageValues).src)
        break
      case 'ImageGallery':
        urls.push(
          ...((currentValues as ImageGalleryValues).images || [])
            .filter((im) => im.src)
            .map((im) => im.src)
        )
        break
      case 'ImageTextLayout':
        if ((currentValues as ImageTextLayoutValues).imageSrc)
          urls.push((currentValues as ImageTextLayoutValues).imageSrc)
        break
      case 'InfoCard':
      default:
        break
    }
    commitUrls(urls)
    const snippet = buildMdxSnippet(component.id, currentValues)
    onSubmit(snippet)
    // コミット済以外はクリーンアップ（通常未使用なし想定だが安全策）
    await cleanupTemp()
  }

  async function handleCancel() {
    await cleanupTemp()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* ヘッダー */}
        <div className="relative mb-2 flex items-start px-6 pt-6">
          <div className="absolute top-6 right-6">
            <button
              type="button"
              aria-label="閉じる"
              onClick={onClose}
              className="focus:ring-primary-300 cursor-pointer rounded-full bg-gray-500 p-2 text-white transition-all hover:bg-gray-600 focus:ring-2 focus:ring-offset-2 focus:outline-none"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{component.label} の設定</h2>
        </div>
        {/* コンテンツ */}
        <div key={localKey} className="max-h-[70vh] overflow-y-auto px-6 py-6">
          {component.id === 'MDXImage' && (
            <MDXImageForm
              onValuesChange={(v) => setCurrentValues(v)}
              onTempUploaded={(u) => tempUploadsRef.current.add(u)}
            />
          )}
          {component.id === 'ImageGallery' && (
            <ImageGalleryForm
              onValuesChange={(v) => setCurrentValues(v)}
              onTempUploaded={(u) => tempUploadsRef.current.add(u)}
            />
          )}
          {component.id === 'ImageTextLayout' && (
            <ImageTextLayoutForm
              onValuesChange={(v) => setCurrentValues(v)}
              onTempUploaded={(u) => tempUploadsRef.current.add(u)}
            />
          )}
          {component.id === 'InfoCard' && (
            <InfoCardForm onValuesChange={(v) => setCurrentValues(v)} />
          )}
        </div>
        {/* フッター */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-3">
          <Button variant="default" size="md" onClick={handleCancel} text="キャンセル" />
          <Button
            variant="primary"
            size="md"
            onClick={handleOk}
            text="OK"
            disabled={!currentValues}
            class="min-w-[100px] px-8"
          />
        </div>
      </div>
    </div>
  )
}
