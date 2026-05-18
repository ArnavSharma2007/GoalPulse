import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateGoalSheet } from '@/lib/goalValidation'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { sheet_id } = await req.json()

  // 1. Fetch all goals for this sheet
  const { data: goals, error: goalsError } = await supabase
    .from('goals')
    .select('*')
    .eq('goal_sheet_id', sheet_id)

  if (goalsError) return NextResponse.json({ error: goalsError.message }, { status: 400 })

  // 2. Validate
  const { valid, errors } = validateGoalSheet(goals || [])
  if (!valid) return NextResponse.json({ errors }, { status: 422 })

  // 3. Verify they own the goal sheet and it is editable
  const { data: sheet, error: sheetError } = await supabase
    .from('goal_sheets')
    .select('id, employee_id, status')
    .eq('id', sheet_id)
    .single()

  if (sheetError || !sheet || !['draft', 'returned'].includes(sheet.status)) {
    return NextResponse.json({ error: "Goal sheet not found or not editable" }, { status: 403 })
  }

  // 4. Update status using Service Role client to bypass RLS transition check
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: updateError } = await supabaseAdmin
    .from('goal_sheets')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', sheet_id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
