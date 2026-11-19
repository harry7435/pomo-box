import type { Block } from '@pomobox/core'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { BlockView } from '../BlockView'

const block: Block = {
  id: 'id-1',
  date: '2026-11-18',
  startMin: 600,
  endMin: 630,
  title: '',
  categoryId: 'cat-work',
  status: 'planned',
  memo: null,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
}

describe('BlockView', () => {
  it('shows a placeholder for an empty title and the time range', async () => {
    await render(<BlockView block={block} color="#3b82f6" onPress={jest.fn()} onToggleStatus={jest.fn()} />)
    expect(screen.getByText('제목 없음')).toBeTruthy()
    expect(screen.getByText('10:00–10:30')).toBeTruthy()
  })

  it('calls onToggleStatus from the status circle and onPress from the body', async () => {
    const onPress = jest.fn()
    const onToggleStatus = jest.fn()
    await render(<BlockView block={block} color="#3b82f6" onPress={onPress} onToggleStatus={onToggleStatus} />)
    await fireEvent.press(screen.getByLabelText('상태: 계획. 눌러서 완료'))
    expect(onToggleStatus).toHaveBeenCalledWith(block)
    expect(onPress).not.toHaveBeenCalled()
    await fireEvent.press(screen.getByText('제목 없음'))
    expect(onPress).toHaveBeenCalledWith(block)
  })
})
