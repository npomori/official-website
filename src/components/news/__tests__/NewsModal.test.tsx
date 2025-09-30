import { fireEvent, render, screen, waitFor } from '@testing-library/react'
//import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NewsModal from '../NewsModal'

// 必要に応じてモック
vi.mock('@/fetch/admin/news', () => ({
  default: {
    createNewsWithFiles: vi.fn(async () => ({ success: true })),
    updateNewsWithFiles: vi.fn(async () => ({ success: true }))
  }
}))

// happy-dom環境でのテスト

describe('NewsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('タイトル未入力でバリデーションエラーが表示される', async () => {
    render(<NewsModal onClose={() => {}} />)
    fireEvent.click(screen.getByText('追加する'))
    await waitFor(() => {
      expect(screen.getByText(/タイトル/)).toBeInTheDocument()
      expect(screen.getByText(/必須/)).toBeInTheDocument()
    })
  })

  it('ファイル数制限を超えるとエラー表示', async () => {
    render(<NewsModal onClose={() => {}} />)
    const input = screen.getByLabelText(/ファイルを選択/)
    // happy-domはFile APIをサポートしている
    const files = Array(100).fill(new File(['dummy'], 'dummy.pdf', { type: 'application/pdf' }))
    fireEvent.change(input, { target: { files } })
    expect(await screen.findByText(/ファイル数が多すぎます/)).toBeInTheDocument()
  })

  it('正常にお知らせが追加できる', async () => {
    render(<NewsModal onClose={() => {}} />)
    fireEvent.change(screen.getByLabelText('タイトル'), { target: { value: 'テストタイトル' } })
    fireEvent.change(screen.getByLabelText('内容'), { target: { value: 'テスト内容' } })
    fireEvent.click(screen.getByText('追加する'))
    await waitFor(() => {
      expect(screen.getByText('お知らせを追加しました')).toBeInTheDocument()
    })
  })
})
