import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  it('shows the Pomobox heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Pomobox' })).toBeInTheDocument()
  })

  it('shows the one-line tagline', () => {
    render(<App />)
    expect(screen.getByText('하루를 블록으로 나누고, 블록 안에서 집중하세요.')).toBeInTheDocument()
  })
})
