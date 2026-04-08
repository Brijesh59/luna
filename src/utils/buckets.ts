import { isPast, isToday } from 'date-fns'
import type { FocusNode, Bucket, BucketMap } from '../types'

export function getBucket(node: FocusNode): Bucket {
  if (node.status === 'done') {
    // If completed within 24 hours, keep in original bucket
    if (node.completedAt && (new Date().getTime() - new Date(node.completedAt).getTime()) < 24 * 60 * 60 * 1000) {
      // Use same logic as pending
      if (node.type === 'idea') return 'ideas'
      if (node.type === 'note') return 'unsorted'
      if (node.priority === 'high') return 'focus'
      if (node.dueAt) {
        const due = new Date(node.dueAt)
        if (isPast(due) || isToday(due)) return 'focus'
        return 'upcoming'
      }
      return 'unsorted'
    } else {
      return 'done'
    }
  }

  if (node.status === 'snoozed' && node.snoozedUntil) {
    if (new Date() < new Date(node.snoozedUntil)) return 'unsorted'
  }

  if (node.type === 'idea') return 'ideas'
  if (node.type === 'note') return 'unsorted'

  // Urgent (high priority) always goes to Focus Now
  if (node.priority === 'high') return 'focus'

  if (node.dueAt) {
    const due = new Date(node.dueAt)
    // Overdue or due today → Focus Now
    if (isPast(due) || isToday(due)) return 'focus'
    // Future date → Upcoming
    return 'upcoming'
  }

  return 'unsorted'
}

export function organizeNodes(nodes: FocusNode[]): BucketMap {
  const map: BucketMap = {
    focus: [],
    upcoming: [],
    ideas: [],
    unsorted: [],
    done: [],
  }

  for (const node of nodes) {
    map[getBucket(node)].push(node)
  }

  map.focus.sort((a, b) => {
    if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    if (a.dueAt) return -1
    if (b.dueAt) return 1
    return 0
  })

  map.upcoming.sort((a, b) => {
    if (a.dueAt && b.dueAt) return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    return 0
  })

  map.ideas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  map.unsorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  map.done.sort((a, b) => {
    const da = a.completedAt ?? a.createdAt
    const db = b.completedAt ?? b.createdAt
    return new Date(db).getTime() - new Date(da).getTime()
  })

  return map
}
