import type { Block, BlockStatus, Category } from '@pomobox/core'
import { BLOCK_STATUSES, BLOCK_UNIT_MIN, formatMin, validateBlockInput } from '@pomobox/core'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { CATEGORY_COLORS, DEFAULT_BLOCK_COLOR, colors } from '../../theme'
import { STATUS_LABELS } from '../timeline/BlockView'
import {
  DURATION_CHIPS,
  canSetDuration,
  canShift,
  ruleErrorMessage,
  setDuration,
  shiftStart,
  type Draft,
} from './draft'

type Props = {
  draft: Draft
  categories: Category[]
  dayBlocks: Block[]
  ignoreId?: string
  isExisting: boolean
  onChange: (draft: Draft) => void
  onSave: (draft: Draft) => void
  onDelete: () => void
}

function Chip({ label, accessibilityLabel, selected, disabled, color, onPress }: {
  label: string; accessibilityLabel: string; selected?: boolean; disabled?: boolean; color?: string; onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled), selected: Boolean(selected) }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: color ?? colors.primary, borderColor: color ?? colors.primary }, disabled && styles.disabled]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  )
}

export function BlockEditorForm({ draft, categories, dayBlocks, ignoreId, isExisting, onChange, onSave, onDelete }: Props) {
  const errors = validateBlockInput(draft, dayBlocks, ignoreId)
  const duration = draft.endMin - draft.startMin

  return (
    <View style={styles.form}>
      <BottomSheetTextInput
        placeholder="무엇을 할까요?"
        value={draft.title}
        onChangeText={(title) => onChange({ ...draft, title })}
        style={styles.titleInput}
      />

      <View style={styles.row}>
        <Chip
          label="−15"
          accessibilityLabel="15분 앞으로"
          disabled={!canShift(draft, -BLOCK_UNIT_MIN)}
          onPress={() => onChange(shiftStart(draft, -BLOCK_UNIT_MIN))}
        />
        <Text style={styles.timeText}>
          {formatMin(draft.startMin)}–{formatMin(draft.endMin)}
        </Text>
        <Chip
          label="+15"
          accessibilityLabel="15분 뒤로"
          disabled={!canShift(draft, BLOCK_UNIT_MIN)}
          onPress={() => onChange(shiftStart(draft, BLOCK_UNIT_MIN))}
        />
      </View>

      <View style={styles.wrap}>
        {DURATION_CHIPS.map((minutes) => (
          <Chip
            key={minutes}
            label={`${minutes}분`}
            accessibilityLabel={`길이 ${minutes}분`}
            selected={duration === minutes}
            disabled={!canSetDuration(draft, minutes)}
            onPress={() => onChange(setDuration(draft, minutes))}
          />
        ))}
      </View>

      <View style={styles.wrap}>
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            accessibilityLabel={`카테고리 ${category.name}`}
            selected={draft.categoryId === category.id}
            color={CATEGORY_COLORS[category.color] ?? DEFAULT_BLOCK_COLOR}
            onPress={() => onChange({ ...draft, categoryId: draft.categoryId === category.id ? null : category.id })}
          />
        ))}
      </View>

      <View style={styles.wrap}>
        {BLOCK_STATUSES.map((status: BlockStatus) => (
          <Chip
            key={status}
            label={STATUS_LABELS[status]}
            accessibilityLabel={`상태 ${STATUS_LABELS[status]}`}
            selected={draft.status === status}
            onPress={() => onChange({ ...draft, status })}
          />
        ))}
      </View>

      {errors.map((error) => (
        <Text key={error.code} style={styles.error}>
          {ruleErrorMessage(error)}
        </Text>
      ))}

      <View style={styles.row}>
        {isExisting && (
          <Pressable accessibilityRole="button" onPress={onDelete} style={styles.deleteButton}>
            <Text style={styles.deleteText}>삭제</Text>
          </Pressable>
        )}
        <View style={styles.spacer} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: errors.length > 0 }}
          disabled={errors.length > 0}
          onPress={() => onSave(draft)}
          style={[styles.saveButton, errors.length > 0 && styles.disabled]}
        >
          <Text style={styles.saveText}>저장</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: 14, padding: 16 },
  titleInput: { fontSize: 18, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeText: { fontSize: 16, fontWeight: '600', minWidth: 110, textAlign: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.line },
  chipText: { fontSize: 13, color: colors.text },
  chipTextSelected: { color: '#ffffff', fontWeight: '600' },
  disabled: { opacity: 0.35 },
  error: { color: colors.danger, fontSize: 13 },
  spacer: { flex: 1 },
  deleteButton: { paddingHorizontal: 12, paddingVertical: 10 },
  deleteText: { color: colors.danger, fontSize: 15 },
  saveButton: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
})
