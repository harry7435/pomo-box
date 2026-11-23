import { DAY_END_MIN, DAY_START_MIN } from '@pomobox/core'
import { StyleSheet, View } from 'react-native'
import { colors } from '../../theme'
import { topOf } from './layout'

export function NowIndicator({ now }: { now: Date }) {
  const min = now.getHours() * 60 + now.getMinutes()
  if (min < DAY_START_MIN || min >= DAY_END_MIN) return null
  return <View pointerEvents="none" style={[styles.line, { top: topOf(min) }]} />
}

const styles = StyleSheet.create({
  line: { position: 'absolute', left: 48, right: 0, height: 2, backgroundColor: colors.now },
})
