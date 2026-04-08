import { useState } from 'react'
import { X, Calendar, Trash2, Plus, XCircle } from 'lucide-react'
import type { FocusNode, Priority, Subtask } from '../types'

// Convert ISO string → "YYYY-MM-DDTHH:mm" for datetime-local input
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface TaskDetailModalProps {
  node: FocusNode
  onClose: () => void
  onUpdate: (node: FocusNode) => void
  onDelete: (id: string) => void
}

const PRIORITY_OPTIONS: { value: Priority; label: string; style: string; active: string }[] = [
  { value: 'high', label: '! URGENT', style: 'bg-gray-100 text-gray-500 border border-transparent', active: 'bg-red-50 text-red-600 border border-red-200' },
  { value: 'medium', label: 'High', style: 'bg-gray-100 text-gray-500 border border-transparent', active: 'bg-orange-50 text-orange-600 border border-orange-200' },
  { value: 'low', label: 'Low', style: 'bg-gray-100 text-gray-500 border border-transparent', active: 'bg-gray-100 text-gray-600 border border-gray-300' },
]

export function TaskDetailModal({ node, onClose, onUpdate, onDelete }: TaskDetailModalProps) {
  const [edited, setEdited] = useState<FocusNode>(node)
  const [newSubtask, setNewSubtask] = useState('')

  const handleSave = () => {
    onUpdate(edited)
    onClose()
  }

  const handleDelete = () => {
    if (confirm('Delete this task?')) {
      onDelete(node.id)
      onClose()
    }
  }

  const addSubtask = () => {
    if (!newSubtask.trim()) return
    const st: Subtask = { id: crypto.randomUUID(), content: newSubtask.trim(), completed: false }
    setEdited({ ...edited, subtasks: [...(edited.subtasks ?? []), st] })
    setNewSubtask('')
  }

  const toggleSubtask = (id: string) => {
    setEdited({
      ...edited,
      subtasks: edited.subtasks?.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)),
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/25 backdrop-blur-[2px] flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2V14M8 2L4 6M8 2L12 6" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Task Detail</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 flex-1">
          {/* Title */}
          <input
            type="text"
            value={edited.content}
            onChange={(e) => setEdited({ ...edited, content: e.target.value })}
            className="text-xl font-bold text-gray-900 w-full outline-none border-b border-transparent focus:border-gray-200 pb-1 transition-colors bg-transparent"
          />

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                Assignee
              </label>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                  {edited.assignee?.[0]?.toUpperCase() ?? '?'}
                </div>
                <input
                  type="text"
                  value={edited.assignee ?? ''}
                  onChange={(e) => setEdited({ ...edited, assignee: e.target.value || undefined })}
                  placeholder="Add assignee"
                  className="text-sm text-gray-700 outline-none flex-1 bg-transparent placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                Due Date
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <input
                  type="datetime-local"
                  value={edited.dueAt ? toDatetimeLocal(edited.dueAt) : ''}
                  onChange={(e) =>
                    setEdited({
                      ...edited,
                      dueAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      reminderAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    })
                  }
                  className="flex-1 text-[13px] text-gray-700 outline-none bg-transparent cursor-pointer"
                />
                {edited.dueAt && (
                  <button
                    onClick={() => setEdited({ ...edited, dueAt: undefined, reminderAt: undefined })}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                    title="Clear date"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Project */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                Project
              </label>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                <input
                  type="text"
                  value={edited.project ?? ''}
                  onChange={(e) => setEdited({ ...edited, project: e.target.value || undefined })}
                  placeholder="Add project"
                  className="text-sm text-gray-700 outline-none flex-1 bg-transparent placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">
                Priority
              </label>
              <div className="flex gap-1.5">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setEdited({ ...edited, priority: opt.value })}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-colors ${
                      edited.priority === opt.value ? opt.active : opt.style
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 block">
              Subtasks
            </label>
            <div className="space-y-2">
              {(edited.subtasks ?? []).map((st) => (
                <div key={st.id} className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={st.completed}
                    onChange={() => toggleSubtask(st.id)}
                    className="w-4 h-4 rounded accent-indigo-600"
                  />
                  <span className={`text-sm ${st.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {st.content}
                  </span>
                </div>
              ))}

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                  placeholder="Add subtask…"
                  className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-gray-200 outline-none focus:border-indigo-300 transition-colors placeholder:text-gray-300"
                />
                <button
                  onClick={addSubtask}
                  className="flex items-center gap-1 text-[12px] font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">
              Notes
            </label>
            <textarea
              value={edited.notes ?? ''}
              onChange={(e) => setEdited({ ...edited, notes: e.target.value || undefined })}
              placeholder="Add notes…"
              rows={3}
              className="w-full text-sm text-gray-700 bg-gray-50 rounded-xl p-3 outline-none resize-none border border-gray-100 focus:border-indigo-200 transition-colors placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Task
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="px-5 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-[13px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-200"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
