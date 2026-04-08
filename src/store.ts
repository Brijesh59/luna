import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { NodeSchema } from './types'
import type { FocusNode } from './types'

interface StoreState {
  nodes: FocusNode[]
  focusMode: boolean
  notificationsEnabled: boolean
  notificationSound: string
  addNode: (node: FocusNode) => void
  updateNode: (node: FocusNode) => void
  deleteNode: (id: string) => void
  toggleDone: (id: string) => void
  setFocusMode: (val: boolean) => void
  setNotificationsEnabled: (val: boolean) => void
  setNotificationSound: (sound: string) => void
  clearAll: () => void
  importNodes: (nodes: FocusNode[]) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      nodes: [],
      focusMode: false,
      notificationsEnabled: false,
      notificationSound: 'smooth_notification.mp3',

      addNode: (node) =>
        set((s) => ({ nodes: [node, ...s.nodes] })),

      updateNode: (updated) =>
        set((s) => ({
          nodes: s.nodes.map((n) => (n.id === updated.id ? updated : n)),
        })),

      deleteNode: (id) =>
        set((s) => ({ nodes: s.nodes.filter((n) => n.id !== id) })),

      toggleDone: (id) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === id
              ? {
                ...n,
                status: n.status === 'done' ? 'pending' : 'done',
                completedAt: n.status === 'done' ? undefined : new Date().toISOString(),
              }
              : n
          ),
        })),

      setFocusMode: (val) => set({ focusMode: val }),
      setNotificationsEnabled: (val) => set({ notificationsEnabled: val }),
      setNotificationSound: (sound) => set({ notificationSound: sound }),

      clearAll: () => set({ nodes: [] }),

      importNodes: (nodes) => {
        // Validate each node via Zod, drop invalid ones
        const valid = nodes.flatMap((n) => {
          const parsed = NodeSchema.safeParse(n)
          return parsed.success ? [parsed.data] : []
        })
        set({ nodes: valid })
      },
    }),
    {
      name: 'focusflow-store',
    }
  )
)
