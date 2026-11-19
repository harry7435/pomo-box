import type { Block } from '@pomobox/core'
import { nextQuickStatus, todayString } from '@pomobox/core'
import { useCallback, useEffect } from 'react'
import { Alert, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRepositories } from '../data/RepositoryProvider'
import { BlockEditorSheet } from '../features/blocks/BlockEditorSheet'
import { DateHeader } from '../features/timeline/DateHeader'
import { Timeline } from '../features/timeline/Timeline'
import { useCategories } from '../features/timeline/useCategories'
import { useDayBlocks } from '../features/timeline/useDayBlocks'
import { useNow } from '../features/timeline/useNow'
import { uiStore, useUiStore } from '../stores/uiStore'
import { colors } from '../theme'

export default function TodayScreen() {
  const { blocks: blockRepository } = useRepositories()
  const selectedDate = useUiStore((s) => s.selectedDate)
  const now = useNow()
  const today = todayString(now)
  const { date: loadedDate, blocks } = useDayBlocks(selectedDate)
  const categories = useCategories()
  const editing = useUiStore((s) => s.editing)
  const sheetDate = editing?.kind === 'new' ? editing.date : selectedDate

  // 자정을 넘기거나 앱이 다시 열릴 때(useNow가 포그라운드에서도 갱신) "오늘"을 따라간다.
  useEffect(() => {
    uiStore.getState().syncToday(today)
  }, [today])
  const onToggleStatus = useCallback(
    (block: Block) => {
      blockRepository.update(block.id, { status: nextQuickStatus(block.status) }).catch(() => {
        Alert.alert('저장하지 못했어요')
      })
    },
    [blockRepository],
  )

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <DateHeader
        date={selectedDate}
        isToday={selectedDate === today}
        onPrev={() => uiStore.getState().moveDays(-1)}
        onNext={() => uiStore.getState().moveDays(1)}
        onToday={() => uiStore.getState().goToday(today)}
      />
      <Timeline
        date={selectedDate}
        loadedDate={loadedDate}
        blocks={blocks}
        categories={categories}
        isToday={selectedDate === today}
        now={now}
        onPressEmpty={(startMin) => {
          if (loadedDate === selectedDate) uiStore.getState().openNew(startMin)
        }}
        onPressBlock={(block) => uiStore.getState().openExisting(block.id)}
        onToggleStatus={onToggleStatus}
      />
      <BlockEditorSheet
        editing={editing}
        date={sheetDate}
        dayBlocks={loadedDate === sheetDate ? blocks : []}
        categories={categories}
        onClose={() => uiStore.getState().closeEditor()}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
})
