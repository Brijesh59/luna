import { useState } from 'react'
import { ChevronDown, ChevronRight, Flame, Calendar, Lightbulb, Pin, Check } from 'lucide-react'
import type { FocusNode } from '../types'
import { NodeItem } from './NodeItem'

interface BucketSectionProps {
  nodes: FocusNode[]
  defaultExpanded?: boolean
  variant: 'focus' | 'upcoming' | 'ideas' | 'unsorted' | 'done'
  onToggleDone: (id: string) => void
  onNodeClick: (node: FocusNode) => void
  onSnooze?: (id: string, until: Date) => void
}

const VARIANTS = {
  focus:    { pill: 'bg-orange-50',  iconColor: 'text-orange-400', Icon: Flame,      title: 'Focus Now' },
  upcoming: { pill: 'bg-blue-50',    iconColor: 'text-blue-400',   Icon: Calendar,   title: 'Upcoming'  },
  ideas:    { pill: 'bg-yellow-50',  iconColor: 'text-yellow-500', Icon: Lightbulb,  title: 'Ideas'     },
  unsorted: { pill: 'bg-gray-100',   iconColor: 'text-gray-400',   Icon: Pin,        title: 'Unsorted'  },
  done:     { pill: 'bg-green-50',   iconColor: 'text-green-500',  Icon: Check,      title: 'Done'      },
}

export function BucketSection({
  nodes,
  defaultExpanded = false,
  variant,
  onToggleDone,
  onNodeClick,
  onSnooze,
}: BucketSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const { pill, iconColor, Icon, title } = VARIANTS[variant]

  if (nodes.length === 0) return null

  return (
    <div className="mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-2 group select-none"
      >
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${pill}`}>
            <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-400 font-medium">
            {nodes.length} {nodes.length === 1 ? 'Task' : 'Tasks'}
          </span>
          <div className="text-gray-300 group-hover:text-gray-400 transition-colors">
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {nodes.map((node) => (
            <NodeItem
              key={node.id}
              node={node}
              onToggleDone={onToggleDone}
              onClick={onNodeClick}
              onSnooze={onSnooze}
            />
          ))}
        </div>
      )}
    </div>
  )
}
