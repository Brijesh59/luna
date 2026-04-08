import { add, startOfDay, set, addDays, addWeeks } from 'date-fns'
import type { NodeType, Priority } from '../types'

export interface ParseResult {
  content: string
  type: NodeType
  priority: Priority
  dueAt?: string
  reminderAt?: string
  assignee?: string
  project?: string
}

const HIGH_KEYWORDS = ['urgent', 'asap', 'critical', 'important']
const LOW_KEYWORDS = ['later', 'someday', 'minor']

// !priority shorthand — detected and stripped separately
const PRIORITY_SHORTHAND_RE = /\B!(high|urgent|low|medium|med)\b/gi

const IDEA_PREFIXES = ['idea:', 'idea ', 'maybe ', 'thought:']
const NOTE_PREFIXES = ['note:', 'note ', 'reminder:']

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
}

const TIME_RE = {
  tomorrowTime: /\btomorrow\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
  tomorrow: /\b(?:tomorrow|tmr)\b/i,
  todayTime: /\btoday\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i,
  timeOnly: /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,
  timeOfDay: /\b(morning|afternoon|evening|night)\b/i,
  relative: /\bin\s+(\d+)\s+(hour|hours|minute|minutes|min|mins)\b/i,
  nextWeek: /\bnext\s+week\b/i,
  dayOfWeek: /\b(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  // "on 17 april", "on april 17", "17 april", "april 17"
  namedDate: /\b(?:on\s+)?(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b|\b(?:on\s+)?(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})\b/i,
}

function resolveHour(raw: string, ampm: string | undefined): number {
  let h = parseInt(raw, 10)
  if (ampm?.toLowerCase() === 'pm' && h !== 12) h += 12
  if (ampm?.toLowerCase() === 'am' && h === 12) h = 0
  // bare numbers <= 8 without ampm in a task context → PM heuristic
  if (!ampm && h >= 1 && h <= 8) h += 12
  return h
}

function parseTime(text: string): Date | undefined {
  const now = new Date()
  const todayStart = startOfDay(now)
  const tomorrowStart = addDays(todayStart, 1)

  const m1 = text.match(TIME_RE.tomorrowTime)
  if (m1) {
    const [, hour, min = '0', ampm] = m1
    return set(tomorrowStart, { hours: resolveHour(hour, ampm), minutes: parseInt(min) })
  }

  if (TIME_RE.tomorrow.test(text)) {
    return set(tomorrowStart, { hours: 9, minutes: 0 })
  }

  const m2 = text.match(TIME_RE.todayTime)
  if (m2) {
    const [, hour, min = '0', ampm] = m2
    return set(todayStart, { hours: resolveHour(hour, ampm), minutes: parseInt(min) })
  }

  const m3 = text.match(TIME_RE.timeOnly)
  if (m3) {
    const [, hour, min = '0', ampm] = m3
    return set(todayStart, { hours: resolveHour(hour, ampm), minutes: parseInt(min) })
  }

  const m4 = text.match(TIME_RE.timeOfDay)
  if (m4) {
    const map: Record<string, number> = { morning: 9, afternoon: 14, evening: 18, night: 20 }
    return set(todayStart, { hours: map[m4[1].toLowerCase()], minutes: 0 })
  }

  const m5 = text.match(TIME_RE.relative)
  if (m5) {
    const num = parseInt(m5[1], 10)
    return m5[2].startsWith('hour') ? add(now, { hours: num }) : add(now, { minutes: num })
  }

  if (TIME_RE.nextWeek.test(text)) {
    return set(addWeeks(todayStart, 1), { hours: 9, minutes: 0 })
  }

  const m6 = text.match(TIME_RE.dayOfWeek)
  if (m6) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const target = days.indexOf(m6[1].toLowerCase())
    const current = now.getDay()
    let diff = target - current
    if (diff <= 0) diff += 7
    return set(addDays(todayStart, diff), { hours: 9, minutes: 0 })
  }

  // "on 17 april" / "april 17" / "17 april"
  const m7 = text.match(TIME_RE.namedDate)
  if (m7) {
    // Group layout: day-first = m7[1] + m7[2], month-first = m7[3] + m7[4]
    const day = parseInt(m7[1] ?? m7[4], 10)
    const monthStr = (m7[2] ?? m7[3]).toLowerCase().slice(0, 3)
    const month = MONTHS[monthStr] ?? MONTHS[Object.keys(MONTHS).find((k) => k.startsWith(monthStr)) ?? '']
    if (month !== undefined && !isNaN(day)) {
      const year = now.getFullYear()
      let candidate = set(startOfDay(now), { year, month, date: day, hours: 9, minutes: 0 })
      // If already past, assume next year
      if (candidate < now) candidate = set(candidate, { year: year + 1 })
      return candidate
    }
  }

  return undefined
}

function detectPriority(text: string): Priority {
  const lower = text.toLowerCase()

  // Check !shorthand first — explicit wins
  const shorthand = lower.match(/\B!(high|urgent|low|medium|med)\b/)
  if (shorthand) {
    const v = shorthand[1]
    if (v === 'high' || v === 'urgent') return 'high'
    if (v === 'low') return 'low'
    if (v === 'medium' || v === 'med') return 'medium'
  }

  if (HIGH_KEYWORDS.some((k) => lower.includes(k))) return 'high'
  if (LOW_KEYWORDS.some((k) => lower.includes(k))) return 'low'
  return 'medium'
}

function detectType(text: string): NodeType {
  const lower = text.toLowerCase()
  if (IDEA_PREFIXES.some((p) => lower.startsWith(p))) return 'idea'
  if (NOTE_PREFIXES.some((p) => lower.startsWith(p))) return 'note'
  return 'task'
}

function cleanContent(text: string): string {
  let s = text
  s = s.replace(TIME_RE.tomorrowTime, '')
  s = s.replace(TIME_RE.tomorrow, '')
  s = s.replace(TIME_RE.todayTime, '')
  s = s.replace(TIME_RE.timeOnly, '')
  s = s.replace(TIME_RE.timeOfDay, '')
  s = s.replace(TIME_RE.relative, '')
  s = s.replace(TIME_RE.nextWeek, '')
  s = s.replace(TIME_RE.namedDate, '')
  s = s.replace(TIME_RE.dayOfWeek, '')
  ;[...HIGH_KEYWORDS, ...LOW_KEYWORDS].forEach((kw) => {
    s = s.replace(new RegExp(`\\b${kw}\\b`, 'gi'), '')
  })
  s = s.replace(/^idea:\s*/i, '')
  s = s.replace(/^note:\s*/i, '')
  s = s.replace(/^reminder:\s*/i, '')
  // Strip !priority shorthands, @assignee, #project tags
  s = s.replace(PRIORITY_SHORTHAND_RE, '')
  s = s.replace(/@[\w-]+/g, '')
  s = s.replace(/#[\w-]+/g, '')
  s = s.replace(/\s+/g, ' ').trim()
  // Strip trailing punctuation left over from removed phrases (e.g. "lawyer -")
  s = s.replace(/[\s\-–—,.:]+$/, '').trim()
  return s
}

export function parseInput(text: string): ParseResult {
  const dueAt = parseTime(text)
  const priority = detectPriority(text)
  const type = detectType(text)

  const assigneeMatch = text.match(/@([\w-]+)/i)
  const projectMatch = text.match(/#([\w-]+)/i)
  const assignee = assigneeMatch?.[1]
  const project = projectMatch?.[1]

  const content = cleanContent(text) || text.trim()

  return {
    content,
    type,
    priority,
    dueAt: dueAt?.toISOString(),
    reminderAt: dueAt?.toISOString(),
    assignee,
    project,
  }
}
