import adminArticleFetch from '@/fetch/admin/article'
import { Icon } from '@iconify/react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
// タグ挿入用モーダル (new ディレクトリ参照)
import {
  ComponentPickerModal,
  ComponentPropsModal,
  type SelectableComponent
} from './TagInsertModals'

// パフォーマンス最適化のためのthrottleユーティリティ
function throttle<T extends unknown[]>(
  func: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let timeoutId: number | null = null
  let lastExecTime = 0
  return (...args: T) => {
    const currentTime = Date.now()

    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = window.setTimeout(
        () => {
          func(...args)
          lastExecTime = Date.now()
          timeoutId = null
        },
        delay - (currentTime - lastExecTime)
      )
    }
  }
}

interface EditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export default function ArticleEditor({
  content,
  onChange,
  placeholder = 'Markdownコンテンツを入力してください...',
  className = ''
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // --- Undo / Redo 履歴管理 -------------------------------------------------
  // Snapshot: 全文、Patch: 部分差分
  type SnapshotEntry = { kind: 'snapshot'; value: string; selStart: number; selEnd: number }
  type PatchEntry = {
    kind: 'patch'
    start: number
    end: number
    text: string
    selStart: number
    selEnd: number
    afterSelStart: number
    afterSelEnd: number
  }
  type HistoryEntry = SnapshotEntry | PatchEntry
  const historyRef = useRef<HistoryEntry[]>([])
  const historyIndexRef = useRef<number>(-1)
  const pendingSelectionRef = useRef<{ s: number; e: number } | null>(null)
  const debouncedPatchRef = useRef<{
    start: number
    end: number
    before: string
    after: string
    baseValue: string
    selStart: number
    selEnd: number
    timer: number | null
  } | null>(null)
  const MAX_HISTORY = 200
  const MAX_PATCH_CHAIN = 30
  const MAX_PATCH_SIZE_BEFORE_SNAPSHOT = 2048
  const DEBOUNCE_MS = 500
  const [dragActive, setDragActive] = useState(false)
  // 任意のドラッグ中 (従来)
  // ファイルドラッグ中のみ true
  const [fileDragActive, setFileDragActive] = useState(false)
  // プレーンテキスト or HTML ドラッグ中のみ true
  const [textDragActive, setTextDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgressText, setUploadProgressText] = useState<string>('')
  const [showInsertLine, setShowInsertLine] = useState(false)
  const [insertLineTop, setInsertLineTop] = useState<number | null>(null)
  const dragMirrorRef = useRef<{
    el: HTMLDivElement
    width: number
    fontSig: string
  } | null>(null)

  // ミラー要素プール管理
  const mirrorPoolRef = useRef<HTMLDivElement[]>([])

  // --- タグ挿入 UI 用状態 ---
  const [pickerOpen, setPickerOpen] = useState(false)
  const [propsOpen, setPropsOpen] = useState(false)
  const [selectedComp, setSelectedComp] = useState<SelectableComponent | null>(null)
  const [caretTop, setCaretTop] = useState<number | null>(null)
  const [textareaFocused, setTextareaFocused] = useState(false)
  const [historyVersion, setHistoryVersion] = useState(0)

  // 履歴の現在値を再構築
  function currentHistoryValue(): string {
    if (historyIndexRef.current < 0) return ''
    const slice = historyRef.current.slice(0, historyIndexRef.current + 1)
    let lastSnapshotIndex = -1
    for (let i = slice.length - 1; i >= 0; i--) {
      const e = slice[i]
      if (!e) continue
      if (e.kind === 'snapshot') {
        lastSnapshotIndex = i
        break
      }
    }
    if (lastSnapshotIndex === -1) return ''
    let val = (slice[lastSnapshotIndex] as SnapshotEntry).value
    for (let i = lastSnapshotIndex + 1; i < slice.length; i++) {
      const e = slice[i]
      if (!e) continue
      if (e.kind === 'patch') {
        const p = e as PatchEntry
        val = val.slice(0, p.start) + p.text + val.slice(p.end)
      }
    }
    return val
  }

  function truncateFuture() {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current.splice(historyIndexRef.current + 1)
    }
  }
  function enforceMax() {
    if (historyRef.current.length <= MAX_HISTORY) return
    // 最後まで適用した値を基点に直近 MAX_HISTORY - 1 件保持
    const val = reconstructUpTo(historyRef.current.length - 1)
    historyRef.current = [
      { kind: 'snapshot', value: val, selStart: 0, selEnd: 0 },
      ...historyRef.current.slice(-MAX_HISTORY + 1)
    ]
    historyIndexRef.current = historyRef.current.length - 1
  }
  function reconstructUpTo(idx: number): string {
    const slice = historyRef.current.slice(0, idx + 1)
    let lastSnapshot = -1
    for (let i = slice.length - 1; i >= 0; i--) {
      const e = slice[i]
      if (!e) continue
      if (e.kind === 'snapshot') {
        lastSnapshot = i
        break
      }
    }
    if (lastSnapshot === -1) return ''
    let val = (slice[lastSnapshot] as SnapshotEntry).value
    for (let i = lastSnapshot + 1; i < slice.length; i++) {
      const e = slice[i]
      if (!e) continue
      if (e.kind === 'patch') {
        const p = e as PatchEntry
        val = val.slice(0, p.start) + p.text + val.slice(p.end)
      }
    }
    return val
  }
  function pushSnapshot(value: string, selStart: number, selEnd: number) {
    truncateFuture()
    historyRef.current.push({ kind: 'snapshot', value, selStart, selEnd })
    enforceMax()
    historyIndexRef.current = historyRef.current.length - 1
    setHistoryVersion((v) => v + 1)
  }
  function pushPatch(p: PatchEntry) {
    truncateFuture()
    historyRef.current.push(p)
    enforceMax()
    historyIndexRef.current = historyRef.current.length - 1
    setHistoryVersion((v) => v + 1)
  }
  function clearDebounceTimer() {
    const buf = debouncedPatchRef.current
    if (buf?.timer) {
      window.clearTimeout(buf.timer)
      buf.timer = null
    }
  }
  function countRecentPatchesSinceLastSnapshot(): number {
    let c = 0
    for (let i = historyRef.current.length - 1; i >= 0; i--) {
      const e = historyRef.current[i]
      if (!e) break
      if (e.kind === 'patch') c++
      else break
    }
    return c
  }
  function flushDebouncedPatch(_force = false) {
    const buf = debouncedPatchRef.current
    if (!buf) return
    const base = buf.baseValue
    const afterVal = buf.after
    if (base === afterVal) {
      clearDebounceTimer()
      debouncedPatchRef.current = null
      return
    }
    // 差分算出
    let s = 0
    while (s < base.length && s < afterVal.length && base[s] === afterVal[s]) s++
    let eBase = base.length
    let eAfter = afterVal.length
    while (eBase > s && eAfter > s && base[eBase - 1] === afterVal[eAfter - 1]) {
      eBase--
      eAfter--
    }
    const replaced = afterVal.slice(s, eAfter)
    const p: PatchEntry = {
      kind: 'patch',
      start: s,
      end: eBase,
      text: replaced,
      selStart: buf.selStart,
      selEnd: buf.selEnd,
      afterSelStart: buf.selStart + replaced.length,
      afterSelEnd: buf.selStart + replaced.length
    }
    const chainLen = countRecentPatchesSinceLastSnapshot()
    if (replaced.length >= MAX_PATCH_SIZE_BEFORE_SNAPSHOT || chainLen >= MAX_PATCH_CHAIN) {
      pushSnapshot(afterVal, p.afterSelStart, p.afterSelEnd)
    } else {
      pushPatch(p)
    }
    clearDebounceTimer()
    debouncedPatchRef.current = null
  }
  function scheduleDebouncedPatch(newContent: string, selStart: number, selEnd: number) {
    const baseVal = currentHistoryValue()
    if (!debouncedPatchRef.current) {
      debouncedPatchRef.current = {
        start: selStart,
        end: selEnd,
        before: baseVal,
        after: newContent,
        baseValue: baseVal,
        selStart,
        selEnd,
        timer: null
      }
    } else {
      debouncedPatchRef.current.after = newContent
      debouncedPatchRef.current.selStart = selStart
      debouncedPatchRef.current.selEnd = selEnd
    }
    clearDebounceTimer()
    debouncedPatchRef.current.timer = window.setTimeout(
      () => flushDebouncedPatch(true),
      DEBOUNCE_MS
    )
  }
  function commitImmediateDiff(
    oldVal: string,
    newVal: string,
    beforeSelStart: number,
    beforeSelEnd: number,
    afterSelStart: number,
    afterSelEnd: number
  ) {
    if (oldVal === newVal) return
    flushDebouncedPatch(true)
    // 差分
    let s = 0
    while (s < oldVal.length && s < newVal.length && oldVal[s] === newVal[s]) s++
    let eOld = oldVal.length
    let eNew = newVal.length
    while (eOld > s && eNew > s && oldVal[eOld - 1] === newVal[eNew - 1]) {
      eOld--
      eNew--
    }
    const replaced = newVal.slice(s, eNew)
    const chainLen = countRecentPatchesSinceLastSnapshot()
    if (replaced.length >= MAX_PATCH_SIZE_BEFORE_SNAPSHOT || chainLen >= MAX_PATCH_CHAIN) {
      pushSnapshot(newVal, afterSelStart, afterSelEnd)
      return
    }
    pushPatch({
      kind: 'patch',
      start: s,
      end: eOld,
      text: replaced,
      selStart: beforeSelStart,
      selEnd: beforeSelEnd,
      afterSelStart,
      afterSelEnd
    })
  }
  function undo() {
    flushDebouncedPatch(true)
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    const entry = historyRef.current[historyIndexRef.current]
    if (!entry) return
    const val = reconstructUpTo(historyIndexRef.current)
    onChange(val)
    pendingSelectionRef.current = { s: entry.selStart, e: entry.selEnd }
    setHistoryVersion((v) => v + 1)
  }
  function redo() {
    flushDebouncedPatch(true)
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    const entry = historyRef.current[historyIndexRef.current]
    if (!entry) return
    const val = reconstructUpTo(historyIndexRef.current)
    let selStart: number
    let selEnd: number
    if (entry.kind === 'snapshot') {
      selStart = entry.selStart
      selEnd = entry.selEnd
    } else {
      selStart = (entry as PatchEntry).afterSelStart
      selEnd = (entry as PatchEntry).afterSelEnd
    }
    onChange(val)
    pendingSelectionRef.current = { s: selStart, e: selEnd }
    setHistoryVersion((v) => v + 1)
  }
  // 初回に空スナップショット
  useEffect(() => {
    if (historyIndexRef.current === -1) {
      pushSnapshot(content, 0, 0)
    }
  }, [])
  // content 更新後に selection 復元
  useEffect(() => {
    if (pendingSelectionRef.current) {
      const { s, e } = pendingSelectionRef.current
      const ta = textareaRef.current
      if (ta) {
        requestAnimationFrame(() => {
          try {
            ta.setSelectionRange(s, e)
          } catch {
            /* ignore */
          }
          updateCaretButtonPosition()
        })
      }
      pendingSelectionRef.current = null
    }
  }, [content])

  // 以下で scheduleDebouncedPatch / commitImmediateDiff を使用する

  // textarea のスタイルを複製した不可視 mirror 要素を確保（プール管理版）
  /**
   * テキスト折り返しを考慮した caret 位置推定のための mirror 要素を取得/再生成。
   * textarea の主要タイポグラフィ / padding / border をコピーし、
   * 与えた文字数ぶんのテキストを流し込んで offsetTop を測定する。
   * プール管理により再利用効率を向上。
   */
  function ensureDragMirror(ta: HTMLTextAreaElement) {
    const style = window.getComputedStyle(ta)
    const fontSig = [style.fontFamily, style.fontSize, style.fontWeight, style.lineHeight].join(':')
    const width = ta.clientWidth

    // 既存のrec確認
    const rec = dragMirrorRef.current
    if (rec && rec.width === width && rec.fontSig === fontSig) {
      return rec.el
    }

    // プールから適切なものを検索
    const existingInPool = mirrorPoolRef.current.find(
      (mirror) => mirror.dataset.fontSig === fontSig && parseFloat(mirror.style.width) === width
    )

    if (existingInPool) {
      dragMirrorRef.current = { el: existingInPool, width, fontSig }
      return existingInPool
    }

    // 新規作成
    const el = document.createElement('div')
    el.style.position = 'absolute'
    el.style.visibility = 'hidden'
    el.style.whiteSpace = 'pre-wrap'
    el.style.wordBreak = 'break-word'
    el.style.top = '0'
    el.style.left = '-9999px'
    el.style.boxSizing = 'border-box'
    el.style.width = width + 'px'
    el.dataset.fontSig = fontSig

    const copyProps = [
      'fontSize',
      'fontFamily',
      'fontWeight',
      'lineHeight',
      'letterSpacing',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'borderLeftWidth',
      'borderRightWidth',
      'borderTopWidth',
      'borderBottomWidth'
    ] as const

    copyProps.forEach((p) => {
      try {
        const v = (style as unknown as Record<string, string>)[p]
        if (v) (el.style as unknown as Record<string, string>)[p] = v
      } catch {
        /* ignore */
      }
    })

    // プールに追加（最大10個まで保持）
    mirrorPoolRef.current.push(el)
    if (mirrorPoolRef.current.length > 10) {
      mirrorPoolRef.current.shift()
    }

    dragMirrorRef.current = { el, width, fontSig }
    return el
  }

  // relY (textarea内部Y, scroll補正前) から caret index を二分探索で推定
  /**
   * textarea 内部の相対Y座標 (padding top を除いた値) から caret の文字インデックスを二分探索で推定。
   * relY はスクロール非補正 (可視領域基準) の値を想定し内部で scrollTop を加味。
   */
  function caretIndexFromRelY(ta: HTMLTextAreaElement, relY: number): number {
    const value = ta.value
    if (!value) return 0
    const mirror = ensureDragMirror(ta)
    const scrollTop = ta.scrollTop
    const targetY = relY + scrollTop
    let lo = 0
    let hi = value.length
    let best = 0
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      mirror.textContent = value.slice(0, mid)
      const marker = document.createElement('span')
      marker.textContent = '\u200b'
      mirror.appendChild(marker)
      document.body.appendChild(mirror)
      const y = marker.offsetTop
      document.body.removeChild(mirror)
      marker.remove()
      if (y <= targetY) {
        best = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return best
  }

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      const oldVal = content
      const newVal = oldVal + text
      onChange(newVal)
      commitImmediateDiff(
        oldVal,
        newVal,
        oldVal.length,
        oldVal.length,
        newVal.length,
        newVal.length
      )
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const oldVal = content
    const newValue = oldVal.slice(0, start) + text + oldVal.slice(end)
    onChange(newValue)
    requestAnimationFrame(() => {
      const pos = start + text.length
      textarea.selectionStart = textarea.selectionEnd = pos
      textarea.focus()
      updateCaretButtonPosition()
    })
    commitImmediateDiff(oldVal, newValue, start, end, start + text.length, start + text.length)
  }

  // --- コンポーネントスニペット挿入 (改行調整) ---
  function insertComponentSnippet(raw: string) {
    let snippet = raw
    if (!snippet.endsWith('\n')) snippet += '\n'
    const ta = textareaRef.current
    if (!ta) {
      // fallback: 末尾追加
      const needLeading = content && !content.endsWith('\n') ? '\n' : ''
      onChange(content + needLeading + snippet)
      return
    }
    const start = ta.selectionStart ?? 0
    const end = ta.selectionEnd ?? start
    const before = content.slice(0, start)
    const after = content.slice(end)
    const needLeading = before.length > 0 && !before.endsWith('\n') && !snippet.startsWith('\n')
    const needTrailing = after.length > 0 && !after.startsWith('\n')
    const newValue =
      (needLeading ? before + '\n' : before) + snippet + (needTrailing ? '\n' + after : after)
    onChange(newValue)
    requestAnimationFrame(() => {
      const pos = (needLeading ? before.length + 1 : before.length) + snippet.length
      try {
        ta.setSelectionRange(pos, pos)
      } catch {
        /* ignore */
      }
      ta.focus()
      updateCaretButtonPosition()
    })
  }

  const handleImageFiles = async (files: File[]) => {
    const imageFiles: File[] = files.filter((f) => f && f.type.startsWith('image/'))
    if (imageFiles.length === 0) return
    setUploading(true)
    setUploadProgressText(`画像アップロード中 (${imageFiles.length} 件) ...`)
    await imageFiles.reduce(async (prev, file, idx) => {
      await prev
      try {
        setUploadProgressText(`アップロード中: ${file.name} (${idx + 1}/${imageFiles.length})`)
        const { url } = await adminArticleFetch.uploadImage(file)
        const alt = file.name.replace(/\.[^.]+$/, '')
        insertAtCursor(`![${alt}](${url})\n`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('image upload failed', err)
        insertAtCursor(`<!-- 画像アップロード失敗: ${file.name} : ${message} -->\n`)
      }
    }, Promise.resolve())
    setUploadProgressText('')
    setUploading(false)
  }

  // --- テキストドロップ (text/plain / text/html) 対応 ----------------------
  function htmlToPlainText(html: string): string {
    const div = document.createElement('div')
    div.innerHTML = html
    let text = div.textContent || ''
    // 改行正規化
    text = text.replace(/\r\n?/g, '\n')
    // 末尾の過剰空行を整える
    text = text.replace(/\n{4,}$/g, '\n\n')
    return text
  }

  function extractDroppedText(dt: DataTransfer): string {
    // text/plain 優先
    const plain = dt.getData('text/plain')
    if (plain) return plain
    const html = dt.getData('text/html')
    if (html) return htmlToPlainText(html)
    return ''
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // DataTransfer 内の種類を判定
    const dt = e.dataTransfer
    const hasFiles = dt.items && Array.from(dt.items).some((i) => i.kind === 'file')
    const hasText = dt.types.includes('text/plain') || dt.types.includes('text/html')
    setDragActive(true)
    setFileDragActive(!!hasFiles)
    setTextDragActive(!hasFiles && hasText)
    setShowInsertLine(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setFileDragActive(false)
    setTextDragActive(false)
    setShowInsertLine(false)
    setInsertLineTop(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const ta = textareaRef.current
    if (!ta) return
    if (!dragActive) return
    // dragover 中に種別が後から確定することがあるので再判定
    const dt = e.dataTransfer
    const hasFiles = dt.items && Array.from(dt.items).some((i) => i.kind === 'file')
    const hasText = dt.types.includes('text/plain') || dt.types.includes('text/html')
    setFileDragActive(!!hasFiles)
    setTextDragActive(!hasFiles && hasText)
    const rect = ta.getBoundingClientRect()
    const style = window.getComputedStyle(ta)
    const paddingTop = parseFloat(style.paddingTop || '0')
    const relY = e.clientY - rect.top - paddingTop
    const idx = caretIndexFromRelY(ta, relY)
    try {
      if (ta.selectionStart !== idx || ta.selectionEnd !== idx) {
        ta.setSelectionRange(idx, idx)
      }
    } catch {
      /* ignore */
    }
    // caret の画面上ライン位置 (mirror再利用) を近似: selection 前方テキストを mirror で測る
    const mirror = ensureDragMirror(ta)
    mirror.textContent = ta.value.slice(0, idx)
    const marker = document.createElement('span')
    marker.textContent = '\u200b'
    mirror.appendChild(marker)
    document.body.appendChild(mirror)
    const markerTop = marker.offsetTop - ta.scrollTop
    document.body.removeChild(mirror)
    marker.remove()
    const lineTop = markerTop + paddingTop
    setInsertLineTop(lineTop)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setFileDragActive(false)
    setTextDragActive(false)
    setShowInsertLine(false)
    setInsertLineTop(null)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      const ta = textareaRef.current
      if (ta && insertLineTop != null) {
        try {
          const style = window.getComputedStyle(ta)
          const paddingTop = parseFloat(style.paddingTop || '0')
          // insertLineTop は可視領域内相対 (paddingTop 加味済) → relY を逆算
          const relY = insertLineTop - paddingTop
          const idx = caretIndexFromRelY(ta, relY)
          ta.setSelectionRange(idx, idx)
        } catch {
          /* ignore */
        }
      }
      void handleImageFiles(files)
      return
    }

    // ファイルが無い場合は text / html ドロップを試みる
    const dropped = extractDroppedText(e.dataTransfer)
    if (dropped) {
      const ta = textareaRef.current
      if (ta && insertLineTop != null) {
        try {
          const style = window.getComputedStyle(ta)
          const paddingTop = parseFloat(style.paddingTop || '0')
          const relY = insertLineTop - paddingTop
          const idx = caretIndexFromRelY(ta, relY)
          ta.setSelectionRange(idx, idx)
        } catch {
          /* ignore */
        }
      }
      // 末尾改行を 1つだけ保証 (行途中の場合の視認性向上)
      let insertText = dropped
      if (!/\n$/.test(insertText)) insertText += '\n'
      insertAtCursor(insertText)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const meta = e.metaKey || e.ctrlKey
    if (meta && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault()
      undo()
      return
    }
    if (meta && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
      e.preventDefault()
      redo()
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd

      const oldVal = content
      const newValue = oldVal.substring(0, start) + '  ' + oldVal.substring(end)
      onChange(newValue)
      commitImmediateDiff(oldVal, newValue, start, end, start + 2, start + 2)

      // カーソル位置を調整
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
      return
    }
    // IME変換中は独自処理をスキップ
    const composing = (e.nativeEvent as unknown as { isComposing?: boolean }).isComposing
    if (composing) return

    const ta = e.currentTarget
    const start = ta.selectionStart ?? 0
    const end = ta.selectionEnd ?? start

    if (e.key === 'Enter') {
      e.preventDefault()
      const oldVal = content
      const newValue = oldVal.slice(0, start) + '\n' + oldVal.slice(end)
      onChange(newValue)
      requestAnimationFrame(() => {
        try {
          ta.setSelectionRange(start + 1, start + 1)
        } catch {
          /* ignore */
        }
        updateCaretButtonPosition()
      })
      commitImmediateDiff(oldVal, newValue, start, end, start + 1, start + 1)
      return
    }
    if (e.key === 'Backspace') {
      if (start === 0 && end === 0) return // 先頭で何もしない
      e.preventDefault()
      let newStart = start
      let newValue: string
      if (end > start) {
        // 選択削除
        newValue = content.slice(0, start) + content.slice(end)
        newStart = start
      } else {
        // 1文字後退
        newValue = content.slice(0, start - 1) + content.slice(end)
        newStart = start - 1
      }
      const oldVal = content
      onChange(newValue)
      requestAnimationFrame(() => {
        try {
          ta.setSelectionRange(newStart, newStart)
        } catch {
          /* ignore */
        }
        updateCaretButtonPosition()
      })
      commitImmediateDiff(oldVal, newValue, start, end, newStart, newStart)
      return
    }
    if (e.key === 'Delete') {
      if (start === content.length && end === content.length) return
      e.preventDefault()
      let newValue: string
      const newStart = start
      if (end > start) {
        newValue = content.slice(0, start) + content.slice(end)
      } else {
        newValue = content.slice(0, start) + content.slice(start + 1)
      }
      const oldVal = content
      onChange(newValue)
      requestAnimationFrame(() => {
        try {
          ta.setSelectionRange(newStart, newStart)
        } catch {
          /* ignore */
        }
        updateCaretButtonPosition()
      })
      commitImmediateDiff(oldVal, newValue, start, end, newStart, newStart)
      return
    }
  }

  // --- caret 行位置計測 & +タグボタン位置更新 (throttle最適化版) ---
  const updateCaretButtonPosition = useCallback(
    throttle(() => {
      const ta = textareaRef.current
      if (!ta) return
      const sel = ta.selectionStart ?? 0
      const value = ta.value
      const style = window.getComputedStyle(ta)

      // ensureDragMirrorを再利用
      const mirror = ensureDragMirror(ta)
      const before = value.slice(0, sel)
      const caretChar = value.charAt(sel) || '\u200b'

      mirror.textContent = before
      const marker = document.createElement('span')
      marker.textContent = caretChar
      mirror.appendChild(marker)
      document.body.appendChild(mirror)
      const markerTop = marker.offsetTop
      document.body.removeChild(mirror)
      marker.remove()

      let lineH = parseFloat(style.lineHeight || '')
      if (!lineH || Number.isNaN(lineH)) {
        const fs = parseFloat(style.fontSize || '16') || 16
        lineH = fs * 1.4
      }
      const relative = markerTop - ta.scrollTop + lineH / 2 - 12 // ボタン高さ補正
      const clamped = Math.min(Math.max(relative, 4), ta.clientHeight - 28)
      setCaretTop(clamped)
    }, 16), // 60fps制限
    []
  )

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return undefined
    const handler = () => updateCaretButtonPosition()
    const evs: Array<[keyof HTMLElementEventMap, EventListener]> = [
      ['keyup', handler],
      ['click', handler],
      ['input', handler],
      ['scroll', handler]
    ]
    evs.forEach(([e, h]) => ta.addEventListener(e, h))
    window.addEventListener('resize', handler)
    document.addEventListener('selectionchange', handler)
    queueMicrotask(() => updateCaretButtonPosition())
    return () => {
      evs.forEach(([e, h]) => ta.removeEventListener(e, h))
      window.removeEventListener('resize', handler)
      document.removeEventListener('selectionchange', handler)
    }
  }, [content])

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white ${className}`}
    >
      <div className="flex flex-shrink-0 items-center border-b border-neutral-200 bg-neutral-50 px-4 py-3">
        <span className="font-bold text-neutral-700">Markdownエディター</span>
        <div className="ml-auto flex items-center gap-1" data-history-version={historyVersion}>
          <button
            type="button"
            aria-label="元に戻す"
            title="元に戻す (Ctrl+Z)"
            onClick={() => undo()}
            disabled={historyIndexRef.current <= 0}
            className="group focus-visible:ring-primary-500 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-600 transition-all duration-150 outline-none hover:border-neutral-400 hover:bg-neutral-100 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon
              icon="mdi:undo"
              className="h-5 w-5 transition-colors duration-150 group-hover:text-neutral-800"
            />
          </button>
          <button
            type="button"
            aria-label="やり直し"
            title="やり直し (Ctrl+Y / Ctrl+Shift+Z)"
            onClick={() => redo()}
            disabled={historyIndexRef.current >= historyRef.current.length - 1}
            className="group focus-visible:ring-primary-500 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-neutral-300 bg-white text-neutral-600 transition-all duration-150 outline-none hover:border-neutral-400 hover:bg-neutral-100 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon
              icon="mdi:redo"
              className="h-5 w-5 transition-colors duration-150 group-hover:text-neutral-800"
            />
          </button>
        </div>
      </div>
      <div
        className={`relative flex-1 overflow-hidden ${dragActive ? (fileDragActive ? 'bg-green-50' : textDragActive ? 'bg-amber-50' : 'bg-green-50') : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <textarea
          ref={textareaRef}
          className="h-full w-full resize-none overflow-auto border-none bg-transparent p-4 font-mono leading-relaxed break-words whitespace-pre-wrap text-neutral-900 outline-none placeholder:text-neutral-400"
          style={{ tabSize: 2 }}
          value={content}
          onChange={(e) => {
            const ta = e.currentTarget
            const val = e.target.value
            const selStart = ta.selectionStart ?? val.length
            const selEnd = ta.selectionEnd ?? selStart
            onChange(val)
            scheduleDebouncedPatch(val, selStart, selEnd)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setTextareaFocused(true)
            updateCaretButtonPosition()
          }}
          onBlur={() => {
            // モーダルを開いている場合はフォーカス喪失でもボタン保持したいので遅延確認
            setTimeout(() => {
              if (!pickerOpen && !propsOpen) setTextareaFocused(false)
            }, 50)
          }}
          placeholder={placeholder}
          spellCheck={false}
        />
        {textareaFocused && !pickerOpen && !propsOpen && (
          <button
            type="button"
            className="absolute right-3 z-20 rounded bg-green-600 px-3 py-1 text-xs font-medium text-white shadow hover:bg-green-500"
            style={caretTop != null ? { top: caretTop } : { top: 8 }}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setPickerOpen(true)}
            title="Reactコンポーネントタグを挿入"
          >
            ＋タグ
          </button>
        )}
        {(dragActive || uploading) && (
          <div
            className={`pointer-events-none absolute inset-0 m-2 flex items-center justify-center rounded border-2 border-dashed ${uploading ? 'border-blue-400 bg-blue-100/40' : fileDragActive ? 'border-green-500 bg-green-500/10' : textDragActive ? 'border-amber-500 bg-amber-500/10' : 'border-green-500 bg-green-500/10'}`}
          >
            <div className="space-y-1 rounded-lg bg-white px-6 py-4 text-center text-sm leading-relaxed font-medium text-neutral-700 shadow-lg">
              {dragActive && !uploading && fileDragActive && (
                <div>画像ファイルをドロップしてください</div>
              )}
              {dragActive && !uploading && textDragActive && <div>テキストをドロップで挿入</div>}
              {uploading && (
                <>
                  <div className="animate-pulse">{uploadProgressText || 'アップロード中...'}</div>
                  <div className="text-xs text-neutral-400">画像以外は無視されます</div>
                </>
              )}
            </div>
            {showInsertLine && insertLineTop !== null && !uploading && (
              <div
                className={`absolute right-0 left-0 h-0.5 ${fileDragActive ? 'bg-green-500/80' : textDragActive ? 'bg-amber-500/80' : 'bg-green-500/80'}`}
                style={{ top: insertLineTop + 'px' }}
              />
            )}
          </div>
        )}
      </div>
      {/* タグ挿入モーダル */}
      <ComponentPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => {
          setSelectedComp(item)
          setPickerOpen(false)
          setPropsOpen(true)
        }}
      />
      <ComponentPropsModal
        open={propsOpen}
        component={selectedComp}
        onClose={() => {
          setPropsOpen(false)
          setSelectedComp(null)
        }}
        onSubmit={(vals) => {
          // ComponentPropsModal では mdxSnippet が渡ってくる (TagInsertModals 内で生成)
          insertComponentSnippet(vals)
          setPropsOpen(false)
          setSelectedComp(null)
          // 挿入後 caret 位置更新
          requestAnimationFrame(() => updateCaretButtonPosition())
        }}
      />
    </div>
  )
}
