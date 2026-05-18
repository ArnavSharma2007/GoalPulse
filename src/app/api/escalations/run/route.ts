import { adminSupabase } from '@/lib/supabase/admin'
import { sendEscalationEmail } from '@/lib/emailSender'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET || 'dev-secret'
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: any[] = []

  const { data: cycle } = await adminSupabase
    .from('cycles').select('*').eq('is_active', true).single()

  if (!cycle) return NextResponse.json({ results: [], message: 'No active cycle' })

  const { data: rules } = await adminSupabase
    .from('escalation_rules').select('*').eq('is_active', true)

  for (const rule of (rules || [])) {
    const thresholdDate = new Date()
    thresholdDate.setDate(thresholdDate.getDate() - rule.days_threshold)

    if (rule.trigger_event === 'goal_not_submitted') {
      const cycleOpenDate = new Date(cycle.phase1_open)
      if (new Date() < cycleOpenDate) continue

      const { data: employees } = await adminSupabase
        .from('users').select('*').eq('role', 'employee')

      for (const emp of (employees || [])) {
        const { data: sheet } = await adminSupabase
          .from('goal_sheets')
          .select('status')
          .eq('employee_id', emp.id)
          .eq('cycle_id', cycle.id)
          .single()

        if (!sheet || sheet.status === 'draft') {
          const daysOverdue = Math.ceil(
            (new Date().getTime() - cycleOpenDate.getTime()) / (1000 * 60 * 60 * 24)
          )
          if (daysOverdue >= rule.days_threshold) {
            try {
              // Get manager email
              let managerEmail: string | undefined
              let managerName: string | undefined
              if (emp.manager_id) {
                const { data: mgr } = await adminSupabase
                  .from('users').select('email, name').eq('id', emp.manager_id).single()
                managerEmail = mgr?.email
                managerName = mgr?.name
              }
              await sendEscalationEmail({
                to: emp.email,
                toName: emp.name,
                managerEmail,
                managerName,
                triggerEvent: 'goal_not_submitted',
                daysOverdue,
              })
              results.push({ employee: emp.email, event: 'goal_not_submitted', sent: true })
            } catch (err: any) {
              results.push({ employee: emp.email, event: 'goal_not_submitted', error: err.message })
            }
          }
        }
      }
    }

    if (rule.trigger_event === 'approval_pending') {
      const { data: pendingSheets } = await adminSupabase
        .from('goal_sheets_with_users')
        .select('*')
        .eq('status', 'submitted')
        .lt('submitted_at', thresholdDate.toISOString())

      for (const sheet of (pendingSheets || [])) {
        const { data: manager } = await adminSupabase
          .from('users').select('email, name').eq('id', sheet.manager_id).single()

        if (manager) {
          try {
            await sendEscalationEmail({
              to: manager.email,
              toName: manager.name,
              triggerEvent: 'approval_pending',
              daysOverdue: rule.days_threshold,
            })
            results.push({ manager: manager.email, event: 'approval_pending', sent: true })
          } catch (err: any) {
            results.push({ manager: manager.email, error: err.message })
          }
        }
      }
    }
  }

  return NextResponse.json({ results, processed: results.length })
}
