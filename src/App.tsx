import { useMemo, useRef, useState } from 'react'
import './App.css'

type GridSize = {
  label: string
  rows: number
  cols: number
}

const GRID_OPTIONS: GridSize[] = [
  { label: '3 x 3', rows: 3, cols: 3 },
  { label: '4 x 4', rows: 4, cols: 4 },
  { label: '4 x 6', rows: 4, cols: 6 },
]

function App() {
  const [sources, setSources] = useState<string[]>([])
  const [newSource, setNewSource] = useState('')
  const [grid, setGrid] = useState<GridSize>(GRID_OPTIONS[0])
  const [page, setPage] = useState(0)

  const perPage = grid.rows * grid.cols
  const totalPages = Math.max(1, Math.ceil(sources.length / perPage))
  const currentPage = Math.min(page, totalPages - 1)

  const pageSources = useMemo(() => {
    const start = currentPage * perPage
    return sources.slice(start, start + perPage)
  }, [sources, currentPage, perPage])

  function addSource() {
    const url = newSource.trim()
    if (!url) return
    setSources((prev) => [...prev, url])
    setNewSource('')
    // Jump to last page where the new item likely resides
    setPage(() => {
      const nextCount = sources.length + 1
      return Math.floor((nextCount - 1) / perPage)
    })
  }

  function removeSource(indexInAll: number) {
    setSources((prev) => prev.filter((_, i) => i !== indexInAll))
  }

  function handleGridChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    const next = GRID_OPTIONS.find((g) => g.label === value)
    if (next) {
      setGrid(next)
      setPage(0)
    }
  }

  function toGlobalIndex(indexInPage: number) {
    return currentPage * perPage + indexInPage
  }

  return (
    <div className="min-h-screen w-full px-4 py-6 md:px-6 lg:px-8">
      <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <h1 className="text-xl font-semibold">CCTV Multi-Source Grid</h1>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Grid</label>
            <select
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
              value={grid.label}
              onChange={handleGridChange}
            >
              {GRID_OPTIONS.map((g) => (
                <option key={g.label} value={g.label}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            type="text"
            placeholder="Enter video URL or path"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm md:w-96"
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addSource()
            }}
          />
          <button
            className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={addSource}
          >
            Add Source
          </button>
        </div>
      </header>

      <section className="mb-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {sources.length} source{sources.length === 1 ? '' : 's'} · {grid.label} · Page {currentPage + 1} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
            disabled={currentPage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Prev
          </button>
          <button
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Next
          </button>
        </div>
      </section>

      <main
        className="grid gap-2 md:gap-3"
        style={{ gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))` }}
      >
        {pageSources.map((src, idx) => (
          <VideoCell
            key={`${src}-${idx}`}
            src={src}
            onRemove={() => removeSource(toGlobalIndex(idx))}
          />
        ))}
        {Array.from({ length: Math.max(0, perPage - pageSources.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="aspect-video w-full rounded border border-dashed border-gray-300 bg-gray-50" 
          />
        ))}
      </main>
    </div>
  )
}

function VideoCell({ src, onRemove }: { src: string; onRemove: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  function enterFullscreen() {
    const el = videoRef.current
    if (!el) return
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {})
      return
    }
    type WithWebkit = HTMLVideoElement & { webkitEnterFullscreen?: () => void }
    const webkitEl = el as WithWebkit
    if (webkitEl.webkitEnterFullscreen) webkitEl.webkitEnterFullscreen()
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded bg-black">
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full object-contain"
        controls
        onClick={enterFullscreen}
      />
      <div className="pointer-events-none absolute inset-0 border border-gray-800/40" />
      <div className="absolute right-1 top-1 flex items-center gap-1">
        <button
          className="pointer-events-auto rounded bg-white/80 px-2 py-1 text-xs text-gray-800 hover:bg-white"
          onClick={(e) => {
            e.stopPropagation()
            enterFullscreen()
          }}
        >
          Fullscreen
        </button>
        <button
          className="pointer-events-auto rounded bg-red-600/90 px-2 py-1 text-xs text-white hover:bg-red-700"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          Remove
        </button>
      </div>
      <div className="absolute bottom-1 left-1 max-w-[90%] truncate rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
        {src}
      </div>
    </div>
  )
}

export default App
