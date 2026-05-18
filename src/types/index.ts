export type UserRole = 'employee' | 'manager' | 'admin'
export type GoalStatus = 'draft' | 'submitted' | 'approved' | 'returned'
export type UomType = 'numeric_min' | 'numeric_max' | 'timeline' | 'zero'
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4'
export type AchievementStatus = 'not_started' | 'on_track' | 'completed'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  manager_id?: string
  department?: string
  created_at: string
}

export interface Goal {
  id: string
  goal_sheet_id: string
  thrust_area_id: string
  title: string
  description?: string
  uom_type: UomType
  target_value?: number
  target_date?: string
  weightage: number
  is_shared: boolean
  shared_parent_id?: string
  created_at: string
}

export interface GoalSheet {
  id: string
  employee_id: string
  cycle_id: string
  status: GoalStatus
  submitted_at?: string
  approved_at?: string
  approved_by?: string
  return_reason?: string
}

export interface Achievement {
  id: string
  goal_id: string
  quarter: Quarter
  actual_value?: number
  actual_date?: string
  status: AchievementStatus
  updated_at: string
}

export interface Cycle {
  id: string
  name: string
  phase1_open: string
  q1_open: string
  q2_open: string
  q3_open: string
  q4_open: string
  is_active: boolean
}
