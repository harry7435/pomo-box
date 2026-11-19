import { addDatabaseChangeListener } from 'expo-sqlite'
import type { Subscribe } from './types'

// expo-sqlite의 변경 이벤트를 테이블 단위 구독으로 바꾼다. DB는 enableChangeListener로 열려 있어야 한다.
export const expoSubscribe: Subscribe = (table, listener) => {
  const subscription = addDatabaseChangeListener((event) => {
    if (event.tableName === table) listener()
  })
  return () => subscription.remove()
}
