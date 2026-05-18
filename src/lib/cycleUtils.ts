import type { Cycle } from '@/types'

export type CycleWindow = 'phase1' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'closed'

export function getCurrentWindow(cycle: Cycle): CycleWindow {
  const now = new Date()
  const dates = {
    phase1: new Date(cycle.phase1_open),
    q1: new Date(cycle.q1_open),
    q2: new Date(cycle.q2_open),
    q3: new Date(cycle.q3_open),
    q4: new Date(cycle.q4_open),
  }

  if (now >= dates.q4) return 'Q4'
  if (now >= dates.q3) return 'Q3'
  if (now >= dates.q2) return 'Q2'
  if (now >= dates.q1) return 'Q1'
  if (now >= dates.phase1) return 'phase1'
  return 'closed'
}

export function getDaysUntilNextWindow(cycle: Cycle): number {
  const now = new Date()
  const allDates = [
    cycle.q1_open, cycle.q2_open, cycle.q3_open, cycle.q4_open
  ].map(d => new Date(d))

  const next = allDates.find(d => d > now)
  if (!next) return 0

  return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}
