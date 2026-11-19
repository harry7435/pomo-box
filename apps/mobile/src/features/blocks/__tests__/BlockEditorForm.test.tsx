import type { Block, Category } from '@pomobox/core'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { useState } from 'react'
import { BlockEditorForm } from '../BlockEditorForm'
import { draftFromNew, type Draft } from '../draft'

const categories: Category[] = [
  { id: 'cat-work', name: '업무', color: 'blue', sortOrder: 0, createdAt: 0, updatedAt: 0, deletedAt: null },
]

const gym: Block = {
  id: 'gym', date: '2026-11-18', startMin: 630, endMin: 660, title: '헬스장', categoryId: null,
  status: 'planned', memo: null, createdAt: 0, updatedAt: 0, deletedAt: null,
}

function Harness({ initial, dayBlocks = [], ignoreId, onSave = jest.fn() }: {
  initial: Draft; dayBlocks?: Block[]; ignoreId?: string; onSave?: (d: Draft) => void
}) {
  const [draft, setDraft] = useState(initial)
  return (
    <BlockEditorForm
      draft={draft}
      categories={categories}
      dayBlocks={dayBlocks}
      ignoreId={ignoreId}
      isExisting={Boolean(ignoreId)}
      onChange={setDraft}
      onSave={onSave}
      onDelete={jest.fn()}
    />
  )
}

describe('BlockEditorForm', () => {
  it('shows the overlap message and disables save', async () => {
    const onSave = jest.fn()
    await render(<Harness initial={draftFromNew(615)} dayBlocks={[gym]} onSave={onSave} />)
    await fireEvent.press(screen.getByLabelText('길이 30분'))
    expect(screen.getByText("10:30–11:00 '헬스장'과 겹쳐요")).toBeTruthy()
    await fireEvent.press(screen.getByText('저장'))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('does not report the edited block as its own conflict', async () => {
    await render(<Harness initial={{ ...draftFromNew(630), endMin: 660 }} dayBlocks={[gym]} ignoreId="gym" />)
    expect(screen.queryByText(/겹쳐요/)).toBeNull()
  })

  it('updates the end time when a duration chip is pressed', async () => {
    await render(<Harness initial={draftFromNew(600)} />)
    await fireEvent.press(screen.getByLabelText('길이 60분'))
    expect(screen.getByText('10:00–11:00')).toBeTruthy()
  })

  it('disables shifting before 06:00 and durations past 24:00', async () => {
    await render(<Harness initial={draftFromNew(360)} />)
    expect(screen.getByLabelText('15분 앞으로').props.accessibilityState).toMatchObject({ disabled: true })

    await render(<Harness initial={draftFromNew(1395)} />)
    expect(screen.getAllByLabelText('길이 60분').at(-1)?.props.accessibilityState).toMatchObject({ disabled: true })
  })

  it('saves the current draft', async () => {
    const onSave = jest.fn()
    await render(<Harness initial={draftFromNew(600)} onSave={onSave} />)
    await fireEvent.changeText(screen.getByPlaceholderText('무엇을 할까요?'), '기획서')
    await fireEvent.press(screen.getByLabelText('카테고리 업무'))
    await fireEvent.press(screen.getByText('저장'))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: '기획서', categoryId: 'cat-work', startMin: 600 }))
  })
})
