import type { Category } from '@pomobox/core'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, BackHandler } from 'react-native'
import { useRepositories } from '../../data/RepositoryProvider'
import type { Editing } from '../../stores/uiStore'
import { useDayBlocks } from '../timeline/useDayBlocks'
import { BlockEditorForm } from './BlockEditorForm'
import { draftFromBlock, draftFromNew, type Draft } from './draft'

type Props = {
  editing: Editing
  date: string
  categories: Category[]
  onClose: () => void
}

export function BlockEditorSheet({ editing, date, categories, onClose }: Props) {
  const { blocks } = useRepositories()
  const sheetRef = useRef<BottomSheetModal>(null)
  // 시트가 다루는 날짜의 블록을 직접 구독한다. 로드 전에는 검증이 비어 있는 목록을 믿지 않도록 저장을 막는다.
  const { date: loadedDate, blocks: dayBlocks } = useDayBlocks(date)
  const ready = loadedDate === date
  const existing = editing?.kind === 'existing' && ready ? dayBlocks.find((b) => b.id === editing.blockId) : undefined
  const [draftState, setDraftState] = useState<{ editing: Editing; draft: Draft | null }>({ editing: null, draft: null })

  // 편집 대상이 바뀔 때만 초안을 새로 만든다(렌더 중 상태 조정 패턴). 기존 블록은 로드된 뒤에 만든다.
  if (draftState.editing !== editing && (editing?.kind !== 'existing' || ready)) {
    const draft = editing?.kind === 'new' ? draftFromNew(editing.startMin) : existing ? draftFromBlock(existing) : null
    setDraftState({ editing, draft })
  }
  const draft = draftState.editing === editing ? draftState.draft : null
  const setDraft = (next: Draft) => setDraftState({ editing, draft: next })

  // 프로그램으로 닫을 때(editing이 null이 됨) 뒤이어 오는 onDismiss가 새로 연 시트를 닫지 않게 표시해 둔다.
  const closingFromProp = useRef(false)
  const presented = useRef(false)
  useEffect(() => {
    if (editing) {
      presented.current = true
      sheetRef.current?.present()
    } else if (presented.current) {
      presented.current = false
      closingFromProp.current = true
      sheetRef.current?.dismiss()
    }
  }, [editing])

  useEffect(() => {
    if (!editing) return
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose()
      return true
    })
    return () => subscription.remove()
  }, [editing, onClose])

  const handleDismiss = () => {
    if (closingFromProp.current) {
      closingFromProp.current = false
      return
    }
    presented.current = false
    onClose()
  }

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
    ),
    [],
  )

  const saving = useRef(false)
  const save = async (value: Draft) => {
    if (saving.current || !editing || !ready) return
    if (editing.kind === 'existing' && !existing) {
      // 편집 중이던 블록이 사라졌다. 새로 만들지 않고 닫는다.
      onClose()
      return
    }
    saving.current = true
    try {
      if (editing.kind === 'existing' && existing) await blocks.update(existing.id, value)
      else await blocks.create({ date, ...value })
      onClose()
    } catch {
      Alert.alert('저장하지 못했어요')
    } finally {
      saving.current = false
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
    <BottomSheetModal ref={sheetRef} onDismiss={handleDismiss} backdropComponent={renderBackdrop} enableDynamicSizing>
      <BottomSheetView>
        {draft && (
          <BlockEditorForm
            draft={draft}
            categories={categories}
            dayBlocks={dayBlocks}
            ignoreId={existing?.id}
            isExisting={Boolean(existing)}
            saveDisabled={!ready}
            onChange={setDraft}
            onSave={save}
            onDelete={confirmDelete}
          />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  )
}
