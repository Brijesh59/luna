import { X, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { Priority } from '../types'

export type SortOption = 'default' | 'priority' | 'due-asc' | 'due-desc' | 'created'

interface FilterBarProps {
  projects: string[]
  activeProject: string | null
  activePriority: Priority | null
  activeSort: SortOption
  onProjectChange: (p: string | null) => void
  onPriorityChange: (p: Priority | null) => void
  onSortChange: (s: SortOption) => void
}

const PRIORITY_OPTIONS: { value: Priority; label: string; dot: string }[] = [
  { value: 'high', label: 'Urgent', dot: 'bg-red-500' },
  { value: 'medium', label: 'High', dot: 'bg-orange-400' },
  { value: 'low', label: 'Low', dot: 'bg-gray-300' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Default (buckets)' },
  { value: 'priority', label: 'Priority' },
  { value: 'due-asc', label: 'Due date ↑' },
  { value: 'due-desc', label: 'Due date ↓' },
  { value: 'created', label: 'Recently added' },
]

function Dropdown({
  trigger,
  children,
}: {
  trigger: React.ReactNode
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl z-30 min-w-[160px] py-1 overflow-hidden">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

function FilterChip({
  label,
  active,
  dot,
  onClear,
  onClick,
}: {
  label: string
  active: boolean
  dot?: string
  onClear?: () => void
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold border transition-all ${
        active
          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
      }`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      {label}
      {active && onClear ? (
        <span
          onClick={(e) => { e.stopPropagation(); onClear() }}
          className="ml-0.5 hover:text-indigo-900"
        >
          <X className="w-3 h-3" />
        </span>
      ) : (
        <ChevronDown className="w-3 h-3 opacity-50" />
      )}
    </button>
  )
}

export function FilterBar({
  projects,
  activeProject,
  activePriority,
  activeSort,
  onProjectChange,
  onPriorityChange,
  onSortChange,
}: FilterBarProps) {
  const hasFilters = activeProject !== null || activePriority !== null || activeSort !== 'default'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Project filter */}
      {projects.length > 0 && (
        <Dropdown
          trigger={
            <FilterChip
              label={activeProject ? `#${activeProject}` : 'Project'}
              active={activeProject !== null}
              onClear={() => onProjectChange(null)}
            />
          }
        >
          {(close) => (
            <>
              {projects.map((p) => (
                <button
                  key={p}
                  onClick={() => { onProjectChange(p === activeProject ? null : p); close() }}
                  className={`w-full text-left px-3 py-2 text-[13px] font-medium transition-colors hover:bg-gray-50 flex items-center gap-2 ${
                    activeProject === p ? 'text-indigo-600' : 'text-gray-700'
                  }`}
                >
                  <span className="text-indigo-400">#</span>
                  {p}
                  {activeProject === p && <span className="ml-auto text-indigo-500 text-xs">✓</span>}
                </button>
              ))}
            </>
          )}
        </Dropdown>
      )}

      {/* Priority filter */}
      <Dropdown
        trigger={
          <FilterChip
            label={activePriority ? PRIORITY_OPTIONS.find(o => o.value === activePriority)!.label : 'Priority'}
            active={activePriority !== null}
            dot={activePriority ? PRIORITY_OPTIONS.find(o => o.value === activePriority)!.dot : undefined}
            onClear={() => onPriorityChange(null)}
          />
        }
      >
        {(close) => (
          <>
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onPriorityChange(opt.value === activePriority ? null : opt.value); close() }}
                className={`w-full text-left px-3 py-2 text-[13px] font-medium transition-colors hover:bg-gray-50 flex items-center gap-2 ${
                  activePriority === opt.value ? 'text-indigo-600' : 'text-gray-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                {opt.label}
                {activePriority === opt.value && <span className="ml-auto text-indigo-500 text-xs">✓</span>}
              </button>
            ))}
          </>
        )}
      </Dropdown>

      {/* Sort */}
      <Dropdown
        trigger={
          <FilterChip
            label={activeSort === 'default' ? 'Sort' : SORT_OPTIONS.find(o => o.value === activeSort)!.label}
            active={activeSort !== 'default'}
            onClear={() => onSortChange('default')}
          />
        }
      >
        {(close) => (
          <>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onSortChange(opt.value); close() }}
                className={`w-full text-left px-3 py-2 text-[13px] font-medium transition-colors hover:bg-gray-50 flex items-center gap-2 ${
                  activeSort === opt.value ? 'text-indigo-600' : 'text-gray-700'
                }`}
              >
                {opt.label}
                {activeSort === opt.value && <span className="ml-auto text-indigo-500 text-xs">✓</span>}
              </button>
            ))}
          </>
        )}
      </Dropdown>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={() => { onProjectChange(null); onPriorityChange(null); onSortChange('default') }}
          className="text-[11px] font-semibold text-gray-400 hover:text-gray-600 transition-colors px-1"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
