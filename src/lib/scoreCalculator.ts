import type { Goal, Achievement, Quarter } from '@/types'

export function computeScore(goal: Goal, achievement: Achievement): number {
  const { uom_type, target_value, target_date } = goal
  const { actual_value, actual_date } = achievement

  switch (uom_type) {
    case 'numeric':
    case 'numeric_min': // Higher is better (Revenue, Sales)
      if (actual_value == null || !target_value) return 0
      return Math.min((actual_value / target_value) * 100, 150)

    case 'numeric_max': // Lower is better (TAT, Cost, Incidents)
      if (actual_value == null || !target_value) return 0
      return Math.min((target_value / actual_value) * 100, 150)

    case 'timeline': // Date-based (project completion)
      if (!actual_date || !target_date) return 0
      const deadline = new Date(target_date)
      const completion = new Date(actual_date)
      if (completion <= deadline) return 100
      const daysLate = Math.ceil(
        (completion.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24)
      )
      return Math.max(100 - daysLate * 2, 0)

    case 'zero': // Zero incidents = full score
      if (actual_value == null) return 0
      return Number(actual_value) === 0 ? 100 : 0

    default:
      return 0
  }
}

export function computeWeightedScore(
  goals: Goal[],
  achievements: Achievement[],
  quarter?: Quarter | null
): number {
  if (goals.length === 0) return 0
  let totalScore = 0
  goals.forEach(goal => {
    // Dynamically find the matching achievement
    const ach = quarter
      ? achievements.find(a => a.goal_id === goal.id && a.quarter === quarter)
      : achievements.find(a => a.goal_id === goal.id && (a.actual_value != null || a.actual_date != null))
        || achievements.find(a => a.goal_id === goal.id)

    if (ach) {
      const score = computeScore(goal, ach)
      totalScore += (goal.weightage / 100) * score
    }
  })
  return Math.round(totalScore * 10) / 10
}

export function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600'
  if (score >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

export function getScoreLabel(score: number): string {
  if (score >= 85) return 'Exceeding'
  if (score >= 70) return 'On Track'
  if (score >= 50) return 'At Risk'
  return 'Below Target'
}
