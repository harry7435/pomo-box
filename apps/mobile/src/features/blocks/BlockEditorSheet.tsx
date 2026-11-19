import type { Block, Category } from '@pomobox/core'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { useRepositories } from '../../data/RepositoryProvider'
import type { Editing } from '../../stores/uiStore'
import { BlockEditorForm } from './BlockEditorForm'
import { draftFromBlock, draftFromNew, type Draft } from './draft'

type Props = {
  editing: Editing
  date: string
  dayBlocks: Block[]
  categories: Category[]
  onClose: () => void
}

export function BlockEditorSheet({ editing, date, dayBlocks, categories, onClose }: Props) {
  const { blocks } = useRepositories()
  const sheetRef = useRef<BottomSheetModal>(null)
  const existing = editing?.kind === 'existing' ? dayBlocks.find((b) => b.id === editing.blockId) : undefined
  const [draftState, setDraftState] = useState<{ editing: Editing; draft: Draft | null }>({ editing: null, draft: null })

  // 편집 대상이 바뀔 때만 초안을 새로 만든다(렌더 중 상태 조정 패턴).
  if (draftState.editing !== editing) {
    const draft = editing?.kind === 'new' ? draftFromNew(editing.startMin) : existing ? draftFromBlock(existing) : null
    setDraftState({ editing, draft })
  }
  const draft = draftState.draft
  const setDraft = (next: Draft) => setDraftState({ editing, draft: next })

  useEffect(() => {
    if (editing) sheetRef.current?.present()
    else sheetRef.current?.dismiss()
  }, [editing])

  const save = async (value: Draft) => {
    try {
      if (existing) await blocks.update(existing.id, value)
      else await blocks.create({ date, ...value })
      onClose()
    } catch {
      Alert.alert('저장하지 못했어요')
    }
  }

  const confirmDelete = () => {
    if (!existing) return
    Alert.alert('블록을 삭제할까요?', undefined, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          blocks.remove(existing.id).then(onClose, () => Alert.alert('삭제하지 못했어요'))
        },
      },
    ])
  }

  return (
    <BottomSheetModal ref={sheetRef} onDismiss={onClose} enableDynamicSizing>
      <BottomSheetView>
        {draft && (
          <BlockEditorForm
            draft={draft}
            categories={categories}
            dayBlocks={dayBlocks}
            ignoreId={existing?.id}
            isExisting={Boolean(existing)}
            onChange={setDraft}
            onSave={save}
            onDelete={confirmDelete}
          />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  )
}
