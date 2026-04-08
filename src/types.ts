import { z } from 'zod'

export const NodeTypeSchema = z.enum(['task', 'note', 'idea'])
export const PrioritySchema = z.enum(['high', 'medium', 'low'])
export const StatusSchema = z.enum(['pending', 'done', 'snoozed'])

export const SubtaskSchema = z.object({
  id: z.string(),
  content: z.string(),
  completed: z.boolean(),
})

export const NodeSchema = z.object({
  id: z.string(),
  content: z.string().min(1),
  type: NodeTypeSchema,
  priority: PrioritySchema,
  status: StatusSchema,
  dueAt: z.string().optional(),       // ISO string for localStorage serialization
  reminderAt: z.string().optional(),
  snoozedUntil: z.string().optional(),
  completedAt: z.string().optional(),
  project: z.string().optional(),
  assignee: z.string().optional(),
  createdAt: z.string(),
  subtasks: z.array(SubtaskSchema).optional(),
  notes: z.string().optional(),
})

export type NodeType = z.infer<typeof NodeTypeSchema>
export type Priority = z.infer<typeof PrioritySchema>
export type Status = z.infer<typeof StatusSchema>
export type Subtask = z.infer<typeof SubtaskSchema>
export type FocusNode = z.infer<typeof NodeSchema>

export type Bucket = 'focus' | 'upcoming' | 'ideas' | 'unsorted' | 'done'

export type BucketMap = Record<Bucket, FocusNode[]>
