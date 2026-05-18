import { adminSupabase } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { computeScore } from '@/lib/scoreCalculator'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cycleId = searchParams.get('cycle_id')

  let sheetsQuery = adminSupabase.from('goal_sheets_with_users').select('*')
  if (cycleId) sheetsQuery = sheetsQuery.eq('cycle_id', cycleId)

  const { data: sheets } = await sheetsQuery

  const rows: any[] = []

  for (const sheet of (sheets || [])) {
    const { data: goals } = await adminSupabase
      .from('goals_with_thrust').select('*').eq('goal_sheet_id', sheet.id)

    for (const goal of (goals || [])) {
      const { data: achievements } = await adminSupabase
        .from('achievements').select('*').eq('goal_id', goal.id)

      const achByQ: Record<string, any> = {}
      achievements?.forEach((a: any) => { achByQ[a.quarter] = a })

      rows.push({
        'Employee Name': sheet.employee_name,
        'Email': sheet.employee_email,
        'Department': sheet.department,
        'Cycle': sheet.cycle_name,
        'Sheet Status': sheet.status,
        'Goal Title': goal.title,
        'Thrust Area': goal.thrust_area_name || 'Unassigned',
        'UoM Type': goal.uom_type,
        'Target Value': goal.target_value || goal.target_date || 'N/A',
        'Weightage (%)': goal.weightage,
        'Q1 Actual': achByQ['Q1']?.actual_value ?? '-',
        'Q1 Score': achByQ['Q1'] ? computeScore(goal, achByQ['Q1']).toFixed(1) : '-',
        'Q2 Actual': achByQ['Q2']?.actual_value ?? '-',
        'Q2 Score': achByQ['Q2'] ? computeScore(goal, achByQ['Q2']).toFixed(1) : '-',
        'Q3 Actual': achByQ['Q3']?.actual_value ?? '-',
        'Q3 Score': achByQ['Q3'] ? computeScore(goal, achByQ['Q3']).toFixed(1) : '-',
        'Q4 Actual': achByQ['Q4']?.actual_value ?? '-',
        'Q4 Score': achByQ['Q4'] ? computeScore(goal, achByQ['Q4']).toFixed(1) : '-',
      })
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Achievement Report')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="GoalPulse_Report_${Date.now()}.xlsx"`,
    }
  })
}
