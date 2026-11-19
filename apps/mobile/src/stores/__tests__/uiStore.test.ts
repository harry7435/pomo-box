import { createUiStore } from '../uiStore'

describe('uiStore', () => {
  it('starts on today and follows today', () => {
    const store = createUiStore('2026-11-18')
    expect(store.getState()).toMatchObject({ selectedDate: '2026-11-18', followToday: true, editing: null })
  })

  it('stops following today when moving to another day, and resumes with goToday', () => {
    const store = createUiStore('2026-11-18')
    store.getState().moveDays(1, '2026-11-18')
    expect(store.getState()).toMatchObject({ selectedDate: '2026-11-19', followToday: false })
    store.getState().goToday('2026-11-18')
    expect(store.getState()).toMatchObject({ selectedDate: '2026-11-18', followToday: true })
  })

  it('keeps following today after moving away and back', () => {
    const store = createUiStore('2026-11-18')
    store.getState().moveDays(-1, '2026-11-18')
    expect(store.getState().followToday).toBe(false)
    store.getState().moveDays(1, '2026-11-18')
    expect(store.getState()).toMatchObject({ selectedDate: '2026-11-18', followToday: true })
  })

  it('moves to the new today after midnight only while following today', () => {
    const following = createUiStore('2026-11-18')
    following.getState().syncToday('2026-11-19')
    expect(following.getState().selectedDate).toBe('2026-11-19')

    const browsing = createUiStore('2026-11-18')
    browsing.getState().moveDays(-3, '2026-11-18')
    browsing.getState().syncToday('2026-11-19')
    expect(browsing.getState().selectedDate).toBe('2026-11-15')
  })

  it('opens a draft or an existing block, and closes the editor', () => {
    const store = createUiStore('2026-11-18')
    store.getState().openNew(600)
    expect(store.getState().editing).toEqual({ kind: 'new', date: '2026-11-18', startMin: 600 })
    store.getState().openExisting('id-1')
    expect(store.getState().editing).toEqual({ kind: 'existing', date: '2026-11-18', blockId: 'id-1' })
    store.getState().closeEditor()
    expect(store.getState().editing).toBeNull()
  })
})
