import { BLOCK_UNIT_MIN } from '@pomobox/core'
import { StyleSheet, Text, View } from 'react-native'

export default function TodayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pomobox</Text>
      <Text>{BLOCK_UNIT_MIN}분 블록으로 하루를 나누고, 블록 안에서 집중하세요.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16 },
  title: { fontSize: 24, fontWeight: '600' },
})
