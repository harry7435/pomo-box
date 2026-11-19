import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { randomUUID } from 'expo-crypto'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { CenteredMessage } from '../components/CenteredMessage'
import { RepositoryProvider, type Repositories } from '../data/RepositoryProvider'
import { createBlockRepository } from '../data/blockRepository'
import { createCategoryRepository, seedDefaultCategories } from '../data/categoryRepository'
import { expoSubscribe } from '../data/expoSubscribe'
import { db } from '../db/client'
import migrations from '../db/migrations/migrations'

/** 마이그레이션이 끝난 뒤에만 마운트된다. 기본 카테고리 시드(동기·멱등)를 첫 렌더 전에 끝낸다. */
function ReadyApp() {
  const [init] = useState<{ repositories: Repositories } | { error: Error }>(() => {
    try {
      seedDefaultCategories(db)
      return {
        repositories: {
          blocks: createBlockRepository({ db, subscribe: expoSubscribe, newId: randomUUID }),
          categories: createCategoryRepository({ db, subscribe: expoSubscribe }),
        },
      }
    } catch (e) {
      return { error: e instanceof Error ? e : new Error(String(e)) }
    }
  })
  if ('error' in init) return <CenteredMessage text={`데이터를 준비하지 못했어요.\n${init.error.message}`} />
  const { repositories } = init
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <RepositoryProvider value={repositories}>
        <BottomSheetModalProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </BottomSheetModalProvider>
      </RepositoryProvider>
    </GestureHandlerRootView>
  )
}

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations)
  if (error) return <CenteredMessage text={`데이터를 준비하지 못했어요.\n${error.message}`} />
  if (!success) return <CenteredMessage text="불러오는 중…" />
  return <ReadyApp />
}
