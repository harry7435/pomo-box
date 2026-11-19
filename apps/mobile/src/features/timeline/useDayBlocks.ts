import type { Block } from '@pomobox/core'
import { useEffect, useState } from 'react'
import { useRepositories } from '../../data/RepositoryProvider'

export function useDayBlocks(date: string): Block[] {
  const { blocks } = useRepositories()
  const [list, setList] = useState<Block[]>([])
  useEffect(() => blocks.observeDay(date, setList), [blocks, date])
  return list
}
