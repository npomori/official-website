import RecordModalLink from '@/components/record/RecordModalLink'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// RecordModal のモック
vi.mock('@/components/record/RecordModal', () => ({
  default: ({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) => (
    <div data-testid="record-modal">
      <div>RecordModal</div>
      <button onClick={onClose}>Close Modal</button>
      <button onClick={onSuccess}>Success</button>
    </div>
  )
}))

describe('RecordModalLink', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  it('正しくレンダリングされる', () => {
    render(<RecordModalLink />)
    expect(screen.getByText('活動記録を追加')).toBeInTheDocument()
  })

  it('ボタンをクリックするとモーダルが表示される', async () => {
    const user = userEvent.setup()
    render(<RecordModalLink />)

    const button = screen.getByText('活動記録を追加')
    await user.click(button)

    expect(screen.getByTestId('record-modal')).toBeInTheDocument()
    expect(screen.getByText('RecordModal')).toBeInTheDocument()
  })

  it('モーダルを閉じることができる', async () => {
    const user = userEvent.setup()
    render(<RecordModalLink />)

    const button = screen.getByText('活動記録を追加')
    await user.click(button)

    expect(screen.getByTestId('record-modal')).toBeInTheDocument()

    const closeButton = screen.getByText('Close Modal')
    await user.click(closeButton)

    expect(screen.queryByTestId('record-modal')).not.toBeInTheDocument()
  })

  it('成功時にページがリロードされる', async () => {
    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true
    })

    const user = userEvent.setup()
    render(<RecordModalLink />)

    const button = screen.getByText('活動記録を追加')
    await user.click(button)

    const successButton = screen.getByText('Success')
    await user.click(successButton)

    expect(reloadMock).toHaveBeenCalled()
  })

  it('SVGアイコンが表示される', () => {
    render(<RecordModalLink />)

    const button = screen.getByText('活動記録を追加').closest('button')
    expect(button).toBeInTheDocument()

    const svg = button?.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
