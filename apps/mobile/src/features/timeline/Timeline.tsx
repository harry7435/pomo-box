import type { Block, Category } from '@pomobox/core'
import { DAY_END_MIN, DAY_START_MIN, formatMin } from '@pomobox/core'
import { useEffect, useRef } from 'react'
import { Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { CATEGORY_COLORS, DEFAULT_BLOCK_COLOR, colors } from '../../theme'
import { BlockView } from './BlockView'
import { NowIndicator } from './NowIndicator'
import { entryScrollY, tapToStartMin, timelineHeight, topOf } from './layout'

type Props = {
  date: string
  /** blocks가 속한 날짜. date와 같을 때만 진입 스크롤을 한다. */
  loadedDate: string | null
  blocks: Block[]
  categories: Category[]
  isToday: boolean
  now: Date
  onPressEmpty: (startMin: number) => void
  onPressBlock: (block: Block) => void
  onToggleStatus: (block: Block) => void
}

const HOURS = Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 60 + 1 }, (_, i) => DAY_START_MIN + i * 60)

export function Timeline({ date, loadedDate, blocks, categories, isToday, now, onPressEmpty, onPressBlock, onToggleStatus }: Props) {
  const scrollRef = useRef<ScrollViewInstance>(null)
  const scrolledForDate = useRef<string | null>(null)
  const { height: windowHeight } = useWindowDimensions()
  const colorOf = (block: Block) => {
    const key = categories.find((c) => c.id === block.categoryId)?.color
    return (key && CATEGORY_COLORS[key]) || DEFAULT_BLOCK_COLOR
  }

  // 현재 날짜의 블록이 로드된 뒤, 날짜당 한 번만 진입 위치로 스크롤한다(블록 변경마다 튀지 않게).
  useEffect(() => {
    if (loadedDate !== date || scrolledForDate.current === date) return
    scrolledForDate.current = date
    scrollRef.current?.scrollTo({ y: entryScrollY({ isToday, now, blocks, windowHeight }), animated: false })
  }, [date, loadedDate, isToday, now, blocks, windowHeight])

  return (
    <ScrollView ref={scrollRef} style={styles.scroll}>
      <Pressable
        accessibilityLabel="빈 칸을 눌러 블록 추가"
        style={{ height: timelineHeight() }}
        onPress={(event) => onPressEmpty(tapToStartMin(event.nativeEvent.locationY))}
      >
        {HOURS.map((min) => (
          <View key={min} pointerEvents="none" style={[styles.hourRow, { top: topOf(min) }]}>
            <Text style={styles.hourLabel}>{formatMin(min)}</Text>
            <View style={styles.hourLine} />
          </View>
        ))}
      </Pressable>
      {blocks.map((block) => (
        <BlockView
          key={block.id}
          block={block}
          color={colorOf(block)}
          onPress={onPressBlock}
          onToggleStatus={onToggleStatus}
        />
      ))}
      {isToday && <NowIndicator now={now} />}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  hourRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', height: 14, marginTop: -7 },
  hourLabel: { width: 48, textAlign: 'right', paddingRight: 6, fontSize: 11, color: colors.muted },
  hourLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
})
