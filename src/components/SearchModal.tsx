import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import type { FocusNode } from '../types'
import { NodeItem } from './NodeItem'

interface SearchModalProps {
  nodes: FocusNode[]
  onClose: () => void
  onToggleDone: (id: string) => void
  onNodeClick: (node: FocusNode) => void
}

export function SearchModal({ nodes, onClose, onToggleDone, onNodeClick }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const filtered = query.trim()
    ? nodes.filter((n) => {
        const haystack = [n.content, n.assignee, n.project, n.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(query.toLowerCase())
      })
    : []

  return (
    <div
      className="fixed inset-0 bg-black/25 backdrop-blur-[2px] flex items-start justify-center z-50 p-4 pt-24"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[65vh] overflow-hidden flex flex-col">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, people, projects…"
            className="flex-1 text-[15px] text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
          />
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {query.trim() === '' ? (
            <div className="py-14 flex flex-col items-center text-gray-400">
              <Search className="w-10 h-10 mb-3 text-gray-200" />
              <p className="text-sm">Start typing to search</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center text-gray-400">
              <p className="text-sm">No results for "{query}"</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {filtered.map((n) => (
                <NodeItem
                  key={n.id}
                  node={n}
                  onToggleDone={onToggleDone}
                  onClick={(node) => {
                    onNodeClick(node)
                    onClose()
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
