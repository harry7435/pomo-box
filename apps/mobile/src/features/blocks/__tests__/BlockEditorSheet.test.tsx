import type { Block, Category } from '@pomobox/core'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { RepositoryProvider, type Repositories } from '../../../data/RepositoryProvider'
import { BlockEditorSheet } from '../BlockEditorSheet'

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'))

const categories: Category[] = []
const gym: Block = {
  id: 'gym', date: '2026-11-18', startMin: 630, endMin: 660, title: '헬스장', categoryId: null,
  status: 'planned', memo: null, createdAt: 0, updatedAt: 0, deletedAt: null,
}

const OTHER = '2026-11-19'

// 실제 observeDay처럼 구독 즉시 동기로 방출한다. loaded에 없는 날짜는 구독해도 방출하지 않는다(미로드).
function setup(createImpl: () => Promise<unknown> = () => Promise.resolve({}), byDate: Record<string, Block[]> = {}) {
  const repos = {
    blocks: {
      create: jest.fn(createImpl),
      update: jest.fn(() => Promise.resolve({})),
      remove: jest.fn(() => Promise.resolve()),
      observeDay: jest.fn((date: string, cb: (list: Block[]) => void) => {
        if (date in byDate) cb(byDate[date])
        return () => {}
      }),
    },
    categories: { observeAll: jest.fn(() => () => {}) },
  } as unknown as Repositories
  const onClose = jest.fn()
  const ui = (editing: Parameters<typeof BlockEditorSheet>[0]['editing'], date = '2026-11-18') => (
    <RepositoryProvider value={repos}>
      <BlockEditorSheet editing={editing} date={date} categories={categories} onClose={onClose} />
    </RepositoryProvider>
  )
  return { repos, onClose, ui }
}

describe('BlockEditorSheet', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  })
  afterEach(() => jest.restoreAllMocks())

  it('does not create before save', async () => {
    const { repos, ui } = setup()
    const editing = { kind: 'new' as const, date: '2026-11-18', startMin: 600 }
    const { rerender } = await render(ui(editing))
    await fireEvent.changeText(screen.getByPlaceholderText('무엇을 할까요?'), '기획서')
    await rerender(ui(null))
    expect(repos.blocks.create).not.toHaveBeenCalled()
  })

  it('creates once on save and closes', async () => {
    const { repos, onClose, ui } = setup(undefined, { '2026-11-18': [] })
    await render(ui({ kind: 'new', date: '2026-11-18', startMin: 600 }))
    await fireEvent.changeText(screen.getByPlaceholderText('무엇을 할까요?'), '기획서')
    await fireEvent.press(screen.getByText('저장'))
    expect(repos.blocks.create).toHaveBeenCalledTimes(1)
    expect(repos.blocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-11-18', title: '기획서', startMin: 600, endMin: 615 }),
    )
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('alerts and stays open when create fails', async () => {
    const { onClose, ui } = setup(() => Promise.reject(new Error('db')), { '2026-11-18': [] })
    await render(ui({ kind: 'new', date: '2026-11-18', startMin: 600 }))
    await fireEvent.press(screen.getByText('저장'))
    expect(Alert.alert).toHaveBeenCalledWith('저장하지 못했어요')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('updates an existing block instead of creating', async () => {
    const { repos, onClose, ui } = setup(undefined, { '2026-11-18': [gym] })
    await render(ui({ kind: 'existing', date: '2026-11-18', blockId: 'gym' }))
    await fireEvent.press(screen.getByText('저장'))
    expect(repos.blocks.update).toHaveBeenCalledWith('gym', expect.objectContaining({ title: '헬스장' }))
    expect(repos.blocks.create).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes without creating when the edited block disappeared', async () => {
    const byDate: Record<string, Block[]> = { '2026-11-18': [gym] }
    const { repos, onClose, ui } = setup(undefined, byDate)
    const editing = { kind: 'existing' as const, date: '2026-11-18', blockId: 'gym' }
    const { rerender } = await render(ui(editing))
    byDate['2026-11-18'] = []
    // 같은 날짜를 다시 구독하게 하려고 observeDay를 다시 부르는 대신, 구독 콜백을 직접 갱신한다.
    const calls = (repos.blocks.observeDay as jest.Mock).mock.calls
    await act(async () => calls[calls.length - 1][1]([]))
    await rerender(ui(editing))
    await fireEvent.press(screen.getByText('저장'))
    expect(repos.blocks.create).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not create while the sheet day has not loaded', async () => {
    const { repos, ui } = setup(undefined, {})
    await render(ui({ kind: 'new', date: OTHER, startMin: 600 }, OTHER))
    await fireEvent.press(screen.getByText('저장'))
    expect(repos.blocks.create).not.toHaveBeenCalled()
  })

  it('blocks save when overlapping a block on the sheet date', async () => {
    const { repos, ui } = setup(undefined, { '2026-11-18': [gym] })
    await render(ui({ kind: 'new', date: '2026-11-18', startMin: 630 }))
    await fireEvent.press(screen.getByText('저장'))
    expect(repos.blocks.create).not.toHaveBeenCalled()
  })
})
