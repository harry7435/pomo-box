import type { Block, BlockStatus } from '@pomobox/core'
import { formatMin, nextQuickStatus } from '@pomobox/core'
import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme'
import { PX_PER_MIN, topOf } from './layout'

export const STATUS_LABELS: Record<BlockStatus, string> = {
  planned: '계획',
  done: '완료',
  partial: '부분',
  skipped: '건너뜀',
}

type Props = {
  block: Block
  color: string
  onPress: (block: Block) => void
  onToggleStatus: (block: Block) => void
}

function StatusCircle({ status, color }: { status: BlockStatus; color: string }) {
  return (
    <View style={[styles.circle, { borderColor: color }]}>
      {status === 'done' && <View style={[styles.fill, { backgroundColor: color }]} />}
      {status === 'partial' && <View style={[styles.halfFill, { backgroundColor: color }]} />}
    </View>
  )
}

export const BlockView = memo(function BlockView({ block, color, onPress, onToggleStatus }: Props) {
  const skipped = block.status === 'skipped'
  const next = STATUS_LABELS[nextQuickStatus(block.status)]
  return (
    <View
      style={[
        styles.container,
        { top: topOf(block.startMin), height: (block.endMin - block.startMin) * PX_PER_MIN, borderLeftColor: color },
        skipped && styles.skipped,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`상태: ${STATUS_LABELS[block.status]}. 눌러서 ${next}`}
        hitSlop={8}
        onPress={() => onToggleStatus(block)}
        style={styles.circleHit}
      >
        <StatusCircle status={block.status} color={color} />
      </Pressable>
      <Pressable style={styles.body} onPress={() => onPress(block)}>
        <Text numberOfLines={1} style={[styles.title, skipped && styles.strike]}>
          {block.title || '제목 없음'}
        </Text>
        <Text style={styles.time}>
          {formatMin(block.startMin)}–{formatMin(block.endMin)}
        </Text>
      </Pressable>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 56,
    right: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f4f4f5',
    borderLeftWidth: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  skipped: { opacity: 0.45 },
  circleHit: { paddingTop: 2, paddingRight: 8 },
  circle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, overflow: 'hidden' },
  fill: { flex: 1 },
  halfFill: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%' },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: colors.text },
  strike: { textDecorationLine: 'line-through' },
  time: { fontSize: 11, color: colors.muted },
})
