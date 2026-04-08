import { useState, useEffect, useRef } from 'react'
import { format, isToday, isTomorrow, isPast } from 'date-fns'
import { CalendarClock, Moon, Flame } from 'lucide-react'
import type { FocusNode } from '../types'

// ── Web notification scheduler ──────────────────────────────
export function useNotification(node: FocusNode) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!node.dueAt || node.status === 'done') return

    // Request permission once
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const due = new Date(node.dueAt).getTime()
    const now = Date.now()
    const delay = due - now

    if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) return // skip past or >7d away

    timerRef.current = setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('FocusFlow Reminder', {
          body: node.content,
          icon: '/favicon.ico',
          tag: node.id, // prevents duplicate
        })
      }
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [node.id, node.dueAt, node.status, node.content])
}

// ── Tooltip ──────────────────────────────────────────────────
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[11px] font-semibold text-white bg-gray-800 rounded-lg whitespace-nowrap pointer-events-none z-50 shadow-lg">
          {label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  )
}

// ── Priority config ──────────────────────────────────────────
const PRIORITY = {
  high:   { dot: 'bg-red-500',    label: 'Urgent', text: 'text-red-500' },
  medium: { dot: 'bg-orange-400', label: 'High',   text: 'text-orange-500' },
  low:    { dot: 'bg-gray-300',   label: 'Low',    text: 'text-gray-400' },
}

function formatDue(date: Date): string {
  if (isToday(date))    return `Today ${format(date, 'h:mm a')}`
  if (isTomorrow(date)) return `Tomorrow ${format(date, 'h:mm a')}`
  return format(date, 'MMM d, h:mm a')
}

// ── Props ────────────────────────────────────────────────────
interface NodeItemProps {
  node: FocusNode
  onToggleDone: (id: string) => void
  onClick: (node: FocusNode) => void
  onSnooze?: (id: string, until: Date) => void
}

// ── Component ────────────────────────────────────────────────
export function NodeItem({ node, onToggleDone, onClick, onSnooze }: NodeItemProps) {
  useNotification(node)

  const isDone   = node.status === 'done'
  const dueDate  = node.dueAt ? new Date(node.dueAt) : undefined
  const isOverdue = dueDate && isPast(dueDate) && !isDone
  const p = PRIORITY[node.priority]

  const handleSnooze1h = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSnooze?.(node.id, new Date(Date.now() + 60 * 60 * 1000))
  }

  return (
    <div
      onClick={() => onClick(node)}
      className="group relative bg-white rounded-xl border border-gray-100 px-4 py-3.5 hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer"
    >
      <div className="flex items-start gap-3">

        {/* Checkbox — rounded square, not circle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleDone(node.id) }}
          className="shrink-0 mt-0.5 focus:outline-none"
        >
          {isDone ? (
            <div className="w-[18px] h-[18px] rounded-[5px] bg-green-500 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <div className={`w-[18px] h-[18px] rounded-[5px] border-2 transition-colors ${
              isOverdue
                ? 'border-red-400 group-hover:border-red-500'
                : 'border-gray-300 group-hover:border-indigo-400'
            }`} />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-[14px] font-semibold leading-snug mb-1.5 truncate ${
            isDone ? 'line-through text-gray-400' : 'text-gray-800'
          }`}>
            {node.content}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">

            {/* Priority — dot + label, no background, no border */}
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${p.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${p.dot}`} />
              {p.label}
            </span>

            {/* Assignee — light indigo bg, no border */}
            {node.assignee && (
              <span className="text-[11px] font-semibold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">
                @{node.assignee.toLowerCase()}
              </span>
            )}

            {/* Due date — light gray bg chip with calendar icon */}
            {dueDate && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                isOverdue
                  ? 'bg-red-50 text-red-500'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                <CalendarClock className="w-3 h-3" />
                {formatDue(dueDate)}
              </span>
            )}

            {/* Project */}
            {node.project && (
              <span className="text-[11px] font-medium text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-md">
                #{node.project.toLowerCase()}
              </span>
            )}

          </div>
        </div>

        {/* Quick actions */}
        {!isDone && onSnooze && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Tooltip label="Snooze 1h">
              <button
                onClick={handleSnooze1h}
                className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-300 hover:text-indigo-500 transition-colors"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip label="Make urgent">
              <button
                onClick={(e) => { e.stopPropagation(); onClick({ ...node, priority: 'high' }) }}
                className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-300 hover:text-orange-500 transition-colors"
              >
                <Flame className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
        )}

      </div>
    </div>
  )
}
