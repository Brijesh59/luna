import { useState, useMemo, useEffect, useRef } from 'react'
import { Archive, Search, Settings, X, Download, Upload, Trash2, Flame } from 'lucide-react'
import { useStore } from './store'
import { parseInput } from './utils/parser'
import { organizeNodes } from './utils/buckets'
import { InputBar } from './components/InputBar'
import { NodeItem } from './components/NodeItem'
import { BucketSection } from './components/BucketSection'
import { EmptyState } from './components/EmptyState'
import { TaskDetailModal } from './components/TaskDetailModal'
import { ArchiveView } from './components/ArchiveView'
import { SearchModal } from './components/SearchModal'
import { FilterBar, type SortOption } from './components/FilterBar'
import type { FocusNode, Priority } from './types'

const notificationSoundOptions: { label: string; value: string }[] = [
  { label: 'Smooth notification', value: 'smooth_notification.mp3' },
  { label: 'Gentle bell', value: 'notification.mp3' },
  { label: 'Phone ping', value: 'i_phone.mp3' },
  { label: 'Soft alert', value: 'faaa.mp3' },
]

export default function App() {
  const {
    nodes,
    focusMode,
    notificationsEnabled,
    notificationSound,
    addNode,
    updateNode,
    deleteNode,
    toggleDone,
    setFocusMode,
    setNotificationsEnabled,
    setNotificationSound,
    clearAll,
    importNodes,
  } = useStore()

  const [selectedNode, setSelectedNode] = useState<FocusNode | null>(null)
  const [now, setNow] = useState(() => Date.now())

  const [view, setView] = useState<'main' | 'archive'>('main')
  const [showSearch, setShowSearch] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [filterProject, setFilterProject] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<Priority | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('default')

  const handleAddNode = (text: string) => {
    const parsed = parseInput(text)
    const newNode: FocusNode = {
      id: crypto.randomUUID(),
      content: parsed.content,
      type: parsed.type,
      priority: parsed.priority,
      status: 'pending',
      dueAt: parsed.dueAt,
      reminderAt: parsed.reminderAt,
      assignee: parsed.assignee,
      project: parsed.project,
      createdAt: new Date().toISOString(),
    }
    addNode(newNode)
  }

  const handleSnooze = (id: string, until: Date) => {
    const node = nodes.find((n) => n.id === id)
    if (!node) return
    updateNode({ ...node, status: 'snoozed', snoozedUntil: until.toISOString() })
  }

  const notificationTimers = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({})

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!enabled) {
      setNotificationsEnabled(false)
      return
    }

    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Push notifications are not supported in this browser.')
      return
    }

    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      setNotificationsEnabled(true)
    } else if (permission === 'denied') {
      alert('Push notifications are blocked. Please enable them in your browser settings.')
      setNotificationsEnabled(false)
    } else {
      setNotificationsEnabled(false)
    }
  }

  const playNotificationSound = () => {
    if (typeof window === 'undefined') return
    const src = `/audio/${notificationSound}`
    const audio = new Audio(src)
    audio.volume = 0.6
    audio.play().catch(() => {
      // ignore autoplay failures, user gesture may be required
    })
  }

  const sendTestNotification = async () => {

    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Push notifications are not supported in this browser.')
      return
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert('Notifications are not enabled or permitted in your browser.')
        return
      }
    }

    if (Notification.permission !== 'granted') {
      alert('Notifications are not enabled or permitted in your browser.')
      return
    }

    playNotificationSound()

    try {
      new Notification('FocusFlow Notification', {
        body: 'Notifications are working — reminder test.',
        icon: '/favicon.svg',
      })
    } catch (error) {
      console.error('Notification failed:', error)
      alert('Notification failed to display. Check browser notification permissions and system settings.')
    }
  }

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {   
    if (!notificationsEnabled || typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      Object.values(notificationTimers.current).forEach((timer) => timer && clearTimeout(timer))
      notificationTimers.current = {}
      return
    }

    const now = Date.now()
    const activeScheduleIds = new Set<string>()
    const timers = notificationTimers.current

    for (const node of nodes) {
      if (node.status === 'done') continue
      const scheduleAt = node.reminderAt ?? node.dueAt
      if (!scheduleAt) continue

      const target = new Date(scheduleAt).getTime()
      const delay = target - now
      if (delay <= 0 || delay > 7 * 24 * 60 * 60 * 1000) continue

      activeScheduleIds.add(node.id)
      if (timers[node.id]) continue

      timers[node.id] = window.setTimeout(() => {
        if (Notification.permission === 'granted') {
          playNotificationSound()
          new Notification('FocusFlow Reminder', {
            body: node.content,
            icon: '/favicon.svg',
            tag: node.id,
          })
        }
        delete timers[node.id]
      }, delay)
    }

    Object.keys(timers).forEach((id) => {
      if (!activeScheduleIds.has(id)) {
        const timer = timers[id]
        if (timer) clearTimeout(timer)
        delete timers[id]
      }
    })

    return () => {
      Object.values(timers).forEach((timer) => timer && clearTimeout(timer))
    }
  }, [nodes, notificationsEnabled])

  const activeNodes = useMemo(
    () =>
      nodes.filter((n) => {
        if (n.status === 'done') {
          if (!n.completedAt) return false
          return new Date().getTime() - new Date(n.completedAt).getTime() < 24 * 60 * 60 * 1000
        }
        if (n.status === 'snoozed' && n.snoozedUntil) {
          return now >= new Date(n.snoozedUntil).getTime()
        }
        return true
      }),
    [nodes, now]
  )

  // All unique projects across all nodes
  const allProjects = useMemo(
    () => [...new Set(nodes.map((n) => n.project).filter(Boolean) as string[])].sort(),
    [nodes]
  )

  // Apply project + priority filters
  const filteredNodes = useMemo(() => {
    return activeNodes.filter((n) => {
      if (filterProject && n.project !== filterProject) return false
      if (filterPriority && n.priority !== filterPriority) return false
      return true
    })
  }, [activeNodes, filterProject, filterPriority])

  // Apply sort (only when not default — default uses bucket ordering)
  const sortedNodes = useMemo(() => {
    if (sortBy === 'default') return filteredNodes
    return [...filteredNodes].sort((a, b) => {
      if (sortBy === 'priority') {
        const order = { high: 0, medium: 1, low: 2 }
        return order[a.priority] - order[b.priority]
      }
      if (sortBy === 'due-asc') {
        if (!a.dueAt && !b.dueAt) return 0
        if (!a.dueAt) return 1
        if (!b.dueAt) return -1
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      }
      if (sortBy === 'due-desc') {
        if (!a.dueAt && !b.dueAt) return 0
        if (!a.dueAt) return 1
        if (!b.dueAt) return -1
        return new Date(b.dueAt).getTime() - new Date(a.dueAt).getTime()
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      return 0
    })
  }, [filteredNodes, sortBy])

  const isFiltered = filterProject !== null || filterPriority !== null || sortBy !== 'default'

  const buckets = useMemo(
    () => organizeNodes(sortBy === 'default' ? filteredNodes : sortedNodes),
    [filteredNodes, sortedNodes, sortBy]
  )

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(nodes, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `focusflow-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string)
          importNodes(Array.isArray(data) ? data : [])
        } catch {
          alert('Invalid file')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  if (view === 'archive') {
    return (
      <ArchiveView
        nodes={nodes}
        onBack={() => setView('main')}
        onToggleDone={toggleDone}
        onNodeClick={(n) => {
          setSelectedNode(n)
          setView('main')
        }}
      />
    )
  }

  const pendingCount = nodes.filter((n) => n.status === 'pending').length

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-gray-100/80">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            {/* <CatMascot active={false} /> */}
            <span className="text-[17px] font-bold text-gray-900 tracking-tight">FocusFlow</span>
            {pendingCount > 0 && (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100">
                {pendingCount}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setView('archive')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-800"
              title="Archive"
            >
              <Archive className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-800"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-gray-800"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-gray-200 mx-1.5" />

            {/* Focus mode toggle */}
            <button
              onClick={() => setFocusMode(!focusMode)}
              className="flex items-center gap-2.5"
            >
              <span className="text-[13px] font-semibold text-gray-600 hidden sm:block">
                Focus Mode
              </span>
              <div
                className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                  focusMode ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    focusMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Input */}
        <div className="mb-6">
          <InputBar onSubmit={handleAddNode} />
        </div>

        {/* Filter bar */}
        {nodes.length > 0 && (
          <div className="mb-8 flex items-center gap-2 flex-wrap">
            <FilterBar
              projects={allProjects}
              activeProject={filterProject}
              activePriority={filterPriority}
              activeSort={sortBy}
              onProjectChange={setFilterProject}
              onPriorityChange={setFilterPriority}
              onSortChange={setSortBy}
            />
            {isFiltered && (
              <span className="text-[11px] text-gray-400 font-medium ml-1">
                {sortedNodes.filter(n => n.status !== 'done').length} result{sortedNodes.filter(n => n.status !== 'done').length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        {nodes.length === 0 ? (
          <EmptyState />
        ) : focusMode ? (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-orange-50">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Focus Now</span>
              </div>
              <span className="text-[12px] text-gray-400 font-medium">
                {Math.min(5, buckets.focus.length)} Tasks
              </span>
            </div>

            {buckets.focus.length > 0 ? (
              <div className="space-y-2.5">
                {buckets.focus.slice(0, 5).map((n) => (
                  <NodeItem
                    key={n.id}
                    node={n}
                    onToggleDone={toggleDone}
                    onClick={setSelectedNode}
                    onSnooze={handleSnooze}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                <p className="text-2xl mb-3">🎉</p>
                <p className="font-bold text-gray-700">All clear! Nothing urgent right now.</p>
                <p className="text-sm mt-1">Great job staying on top of things.</p>
              </div>
            )}
          </div>
        ) : sortBy !== 'default' ? (
          /* Flat sorted list */
          <div className="space-y-2">
            {sortedNodes.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-12">No tasks match the current filters.</p>
            ) : (
              sortedNodes.map((n) => (
                <NodeItem
                  key={n.id}
                  node={n}
                  onToggleDone={toggleDone}
                  onClick={setSelectedNode}
                  onSnooze={handleSnooze}
                />
              ))
            )}
          </div>
        ) : (
          /* Default bucketed view */
          <div>
            <BucketSection variant="focus"    nodes={buckets.focus}    defaultExpanded={true} onToggleDone={toggleDone} onNodeClick={setSelectedNode} onSnooze={handleSnooze} />
            <BucketSection variant="upcoming" nodes={buckets.upcoming}                        onToggleDone={toggleDone} onNodeClick={setSelectedNode} onSnooze={handleSnooze} />
            <BucketSection variant="ideas"    nodes={buckets.ideas}                           onToggleDone={toggleDone} onNodeClick={setSelectedNode} />
            <BucketSection variant="unsorted" nodes={buckets.unsorted}                        onToggleDone={toggleDone} onNodeClick={setSelectedNode} />
            <BucketSection variant="done"     nodes={buckets.done}                            onToggleDone={toggleDone} onNodeClick={setSelectedNode} />
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedNode && (
        <TaskDetailModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onUpdate={(n) => {
            updateNode(n)
            setSelectedNode(null)
          }}
          onDelete={(id) => {
            deleteNode(id)
            setSelectedNode(null)
          }}
        />
      )}

      {showSearch && (
        <SearchModal
          nodes={nodes}
          onClose={() => setShowSearch(false)}
          onToggleDone={toggleDone}
          onNodeClick={(n) => {
            setSelectedNode(n)
            setShowSearch(false)
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          nodeCount={nodes.length}
          notificationsEnabled={notificationsEnabled}
          notificationSound={notificationSound}
          onToggleNotifications={handleNotificationToggle}
          onSetNotificationSound={setNotificationSound}
          onSendTestNotification={sendTestNotification}
          onClose={() => setShowSettings(false)}
          onClearAll={() => {
            if (confirm('Delete ALL tasks? This cannot be undone.')) {
              clearAll()
              setShowSettings(false)
            }
          }}
          onExport={handleExport}
          onImport={handleImport}
        />
      )}
    </div>
  )
}

interface SettingsModalProps {
  nodeCount: number
  notificationsEnabled: boolean
  notificationSound: string
  onToggleNotifications: (enabled: boolean) => void
  onSetNotificationSound: (sound: string) => void
  onSendTestNotification: () => void
  onClose: () => void
  onClearAll: () => void
  onExport: () => void
  onImport: () => void
}

function SettingsModal({ nodeCount, notificationsEnabled, notificationSound, onToggleNotifications, onSetNotificationSound, onSendTestNotification, onClose, onClearAll, onExport, onImport }: SettingsModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/25 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[15px] font-bold text-gray-900">Settings</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <p className="text-[12px] text-gray-400 mb-5">
          {nodeCount} task{nodeCount !== 1 ? 's' : ''} stored locally
        </p>

        <div className="space-y-3">
          <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Push notifications</p>
                <p className="text-[12px] text-gray-500 mt-1">
                  Receive browser reminders for tasks with a date/time.
                </p>
              </div>
              <button
                onClick={() => onToggleNotifications(!notificationsEnabled)}
                className={`px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
                  notificationsEnabled
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {notificationsEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            <div className="mt-3 space-y-3">
              <label className="block text-[12px] font-semibold text-gray-700">Notification sound</label>
              <div className="flex items-center gap-2">
                <select
                  value={notificationSound}
                  onChange={(e) => onSetNotificationSound(e.target.value)}
                  className="flex-1 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-indigo-300 transition-colors"
                >
                  {notificationSoundOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={onSendTestNotification}
                  className="px-3 py-2 rounded-full bg-white text-gray-700 border border-gray-200 text-sm font-semibold hover:bg-gray-100 transition-colors"
                >
                  Preview
                </button>
              </div>
              <p className="text-[11px] text-gray-500">Default is smooth_notification.mp3.</p>
            </div>
            {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied' && (
              <p className="text-[11px] text-red-500 mt-3">
                Browser notifications are blocked. Please enable them in your browser settings.
              </p>
            )}
          </div>
          <button
            onClick={onExport}
            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100"
          >
            <Download className="w-4 h-4 text-gray-400" />
            Export data (JSON)
          </button>
          <button
            onClick={onImport}
            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100"
          >
            <Upload className="w-4 h-4 text-gray-400" />
            Import data
          </button>
          <button
            onClick={onClearAll}
            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-100"
          >
            <Trash2 className="w-4 h-4" />
            Clear all data
          </button>
        </div>
      </div>
    </div>
  )
}
