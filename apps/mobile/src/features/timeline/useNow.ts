import { useEffect, useState } from 'react'
import { AppState } from 'react-native'

/** 1분마다, 그리고 앱이 포그라운드로 돌아올 때 갱신되는 현재 시각. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date())
    })
    return () => {
      clearInterval(id)
      subscription.remove()
    }
  }, [intervalMs])
  return now
}
