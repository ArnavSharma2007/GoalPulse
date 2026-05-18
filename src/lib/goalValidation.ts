import type { Goal } from '@/types'

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateGoalSheet(goals: Partial<Goal>[]): ValidationResult {
  const errors: string[] = []

  if (goals.length === 0) {
    errors.push('Add at least 1 goal before submitting.')
  }

  if (goals.length > 8) {
    errors.push('Maximum 8 goals allowed per employee.')
  }

  goals.forEach((g, i) => {
    const num = i + 1
    if (!g.title?.trim()) errors.push(`Goal ${num}: Title is required.`)
    if (!g.uom_type) errors.push(`Goal ${num}: Unit of Measurement is required.`)
    if (!g.weightage || g.weightage < 10) {
      errors.push(`Goal ${num}: Minimum weightage is 10%.`)
    }
    if (g.uom_type !== 'zero' && !g.target_value && g.uom_type !== 'timeline') {
      errors.push(`Goal ${num}: Target value is required for this UoM type.`)
    }
    if (g.uom_type === 'timeline' && !g.target_date) {
      errors.push(`Goal ${num}: Target date is required for Timeline goals.`)
    }
  })

  const totalWeight = goals.reduce((sum, g) => sum + Number(g.weightage || 0), 0)
  if (Math.abs(totalWeight - 100) > 0.01) {
    errors.push(`Total weightage is ${totalWeight}% — must equal exactly 100%.`)
  }

  return { valid: errors.length === 0, errors }
}
