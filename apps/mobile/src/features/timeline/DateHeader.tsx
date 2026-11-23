import { formatDateLabel } from '@pomobox/core'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme'

type Props = {
  date: string
  isToday: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function DateHeader({ date, isToday, onPrev, onNext, onToday }: Props) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityLabel="이전 날" hitSlop={12} onPress={onPrev}>
        <Text style={styles.arrow}>‹</Text>
      </Pressable>
      <Text style={styles.label}>{formatDateLabel(date)}</Text>
      <Pressable accessibilityLabel="다음 날" hitSlop={12} onPress={onNext}>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
      <View style={styles.spacer} />
      {!isToday && (
        <Pressable accessibilityRole="button" onPress={onToday} style={styles.todayButton}>
          <Text style={styles.todayText}>오늘</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  arrow: { fontSize: 28, color: colors.text, lineHeight: 30 },
  label: { fontSize: 18, fontWeight: '700', color: colors.text },
  spacer: { flex: 1 },
  todayButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.line },
  todayText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
})
