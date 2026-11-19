import type { Block, Category } from '@pomobox/core'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { RepositoryProvider, type Repositories } from '../../../data/RepositoryProvider'
import { BlockEditorSheet } from '../BlockEditorSheet'

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'))

const categories: Category[] = []
const gym: Block = {
  id: 'gym', date: '2026-11-18', startMin: 630, endMin: 660, title: '헬스장', categoryId: null,
  status: 'planned', memo: null, createdAt: 0, updatedAt: 0, deletedAt: null,
}

function setup(createImpl: () => Promise<unknown> = () => Promise.resolve({})) {
  const repos = {
    blocks: {
      create: jest.fn(createImpl),
      update: jest.fn(() => Promise.resolve({})),
      remove: jest.fn(() => Promise.resolve()),
    },
    categories: { observeAll: jest.fn(() => () => {}) },
  } as unknown as Repositories
  const onClose = jest.fn()
  const ui = (editing: Parameters<typeof BlockEditorSheet>[0]['editing'], dayBlocks: Block[] = []) => (
    <RepositoryProvider value={repos}>
      <BlockEditorSheet editing={editing} date="2026-11-18" dayBlocks={dayBlocks} categories={categories} onClose={onClose} />
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
    const { repos, onClose, ui } = setup()
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
    const { onClose, ui } = setup(() => Promise.reject(new Error('db')))
    await render(ui({ kind: 'new', date: '2026-11-18', startMin: 600 }))
    await fireEvent.press(screen.getByText('저장'))
    expect(Alert.alert).toHaveBeenCalledWith('저장하지 못했어요')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('updates an existing block instead of creating', async () => {
    const { repos, onClose, ui } = setup()
    await render(ui({ kind: 'existing', blockId: 'gym' }, [gym]))
    await fireEvent.press(screen.getByText('저장'))
    expect(repos.blocks.update).toHaveBeenCalledWith('gym', expect.objectContaining({ title: '헬스장' }))
    expect(repos.blocks.create).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes without creating when the edited block disappeared', async () => {
    const { repos, onClose, ui } = setup()
    const editing = { kind: 'existing' as const, blockId: 'gym' }
    const { rerender } = await render(ui(editing, [gym]))
    await rerender(ui(editing, []))
    await fireEvent.press(screen.getByText('저장'))
    expect(repos.blocks.create).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
