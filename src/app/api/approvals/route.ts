import { createClient } from '@/lib/supabase/server'
import { adminSupabase } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/auditLogger'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const body = await req.json()
  const { action, sheet_id, return_reason } = body

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (action === 'approve') {
    // 1. Update sheet status
    await adminSupabase
      .from('goal_sheets')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: session.user.id
      })
      .eq('id', sheet_id)

    // 2. Lock all goals in this sheet
    await adminSupabase
      .from('goals')
      .update({ is_locked: true })
      .eq('goal_sheet_id', sheet_id)

    // 3. Create empty achievement rows for each quarter
    const { data: goals } = await adminSupabase
      .from('goals')
      .select('id')
      .eq('goal_sheet_id', sheet_id)

    if (goals) {
      const achievementRows = goals.flatMap(g =>
        ['Q1', 'Q2', 'Q3', 'Q4'].map(q => ({
          goal_id: g.id,
          quarter: q,
          status: 'not_started'
        }))
      )
      await adminSupabase.from('achievements').insert(achievementRows)
    }

    await logAudit(adminSupabase, {
      tableName: 'goal_sheets',
      recordId: sheet_id,
      changedBy: session.user.id,
      changeType: 'APPROVE',
      newValues: { status: 'approved' }
    })

    return NextResponse.json({ success: true, action: 'approved' })
  }

  if (action === 'return') {
    await adminSupabase
      .from('goal_sheets')
      .update({ status: 'returned', return_reason })
      .eq('id', sheet_id)

    await logAudit(adminSupabase, {
      tableName: 'goal_sheets',
      recordId: sheet_id,
      changedBy: session.user.id,
      changeType: 'RETURN',
      newValues: { status: 'returned', return_reason }
    })

    return NextResponse.json({ success: true, action: 'returned' })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
