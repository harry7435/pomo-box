import type { Category } from '@pomobox/core'
import { useEffect, useState } from 'react'
import { useRepositories } from '../../data/RepositoryProvider'

export function useCategories(): Category[] {
  const { categories } = useRepositories()
  const [list, setList] = useState<Category[]>([])
  useEffect(() => categories.observeAll(setList), [categories])
  return list
}
