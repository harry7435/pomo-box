import { BLOCK_UNIT_MIN } from '@pomobox/core'

function App() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-white px-4 text-zinc-900">
      <h1 className="text-3xl font-semibold">Pomobox</h1>
      <p className="text-zinc-600">{BLOCK_UNIT_MIN}분 블록으로 하루를 나누고, 블록 안에서 집중하세요.</p>
    </main>
  )
}

export default App
