import type { Block } from '@pomobox/core'
import { useEffect, useState } from 'react'
import { useRepositories } from '../../data/RepositoryProvider'

export type DayBlocks = { date: string | null; blocks: Block[] }

/** 목록이 어느 날짜의 것인지 함께 돌려준다(날짜 전환 직후 이전 날 목록과 구분하려고). */
export function useDayBlocks(date: string): DayBlocks {
  const { blocks } = useRepositories()
  const [state, setState] = useState<DayBlocks>({ date: null, blocks: [] })
  useEffect(() => blocks.observeDay(date, (list) => setState({ date, blocks: list })), [blocks, date])
  return state
}
