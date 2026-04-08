import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { isToday, isYesterday, isThisWeek, format } from 'date-fns'
import type { FocusNode } from '../types'
import { NodeItem } from './NodeItem'

interface ArchiveViewProps {
  nodes: FocusNode[]
  onBack: () => void
  onToggleDone: (id: string) => void
  onNodeClick: (node: FocusNode) => void
}

type Group = { title: string; nodes: FocusNode[] }

function groupByTime(nodes: FocusNode[]): Group[] {
  const today: FocusNode[] = []
  const yesterday: FocusNode[] = []
  const week: FocusNode[] = []
  const older: FocusNode[] = []

  for (const n of nodes) {
    const d = new Date(n.completedAt ?? n.createdAt)
    if (isToday(d)) today.push(n)
    else if (isYesterday(d)) yesterday.push(n)
    else if (isThisWeek(d, { weekStartsOn: 1 })) week.push(n)
    else older.push(n)
  }

  return [
    today.length ? { title: 'TODAY', nodes: today } : null,
    yesterday.length ? { title: 'YESTERDAY', nodes: yesterday } : null,
    week.length ? { title: 'THIS WEEK', nodes: week } : null,
    older.length ? { title: 'OLDER', nodes: older } : null,
  ].filter(Boolean) as Group[]
}

export function ArchiveView({ nodes, onBack, onToggleDone, onNodeClick }: ArchiveViewProps) {
  const done = nodes
    .filter((n) => n.status === 'done')
    .sort((a, b) => {
      const da = new Date(a.completedAt ?? a.createdAt).getTime()
      const db = new Date(b.completedAt ?? b.createdAt).getTime()
      return db - da
    })

  const groups = groupByTime(done)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/20">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Archive</h1>
          </div>
          <div className="flex items-center gap-1.5 text-[13px] text-gray-500 font-medium">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            {done.length} Tasks Completed
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        {done.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-gray-400">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-base font-semibold">No completed tasks yet</p>
            <p className="text-sm mt-1">Your completed tasks will appear here</p>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map((g, i) => (
              <div key={i}>
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                  {g.title}
                </h2>
                <div className="space-y-2">
                  {g.nodes.map((n) => (
                    <div key={n.id} className="relative">
                      <NodeItem node={n} onToggleDone={onToggleDone} onClick={onNodeClick} />
                      {n.completedAt && (
                        <div className="absolute right-4 top-3.5 text-[11px] text-gray-400 flex items-center gap-1 pointer-events-none">
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1" />
                            <path d="M5.5 3V5.5L7 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                          </svg>
                          Completed {format(new Date(n.completedAt), 'h:mm a')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {done.length > 20 && (
              <div className="text-center pt-6">
                <button className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors">
                  Load more history
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
