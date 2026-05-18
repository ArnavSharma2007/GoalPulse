import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { validateGoalSheet } from '@/lib/goalValidation'

// GET: fetch goals for a goal_sheet
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const sheetId = searchParams.get('sheet_id')

  const { data, error } = await supabase
    .from('goals_with_thrust')
    .select('*')
    .eq('goal_sheet_id', sheetId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// POST: create a new goal
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const body = await req.json()
  const { goal_sheet_id, ...goalData } = body

  const { data, error } = await supabase
    .from('goals')
    .insert({ goal_sheet_id, ...goalData })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// PATCH: update a goal
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const body = await req.json()
  const { id, ...updates } = body

  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .eq('is_locked', false)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// DELETE: remove a goal
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  // 1. Fetch the goal using the user's authenticated client to verify access
  const { data: goal, error: fetchError } = await supabase
    .from('goals')
    .select('id, goal_sheet_id, is_locked')
    .eq('id', id)
    .single()

  if (fetchError || !goal) {
    return NextResponse.json({ error: "Goal not found or unauthorized access" }, { status: 403 })
  }

  if (goal.is_locked) {
    return NextResponse.json({ error: "Goal is locked and cannot be deleted" }, { status: 400 })
  }

  // 2. Fetch the corresponding goal sheet status using user client to verify it's editable
  const { data: sheet, error: sheetError } = await supabase
    .from('goal_sheets')
    .select('status')
    .eq('id', goal.goal_sheet_id)
    .single()

  if (sheetError || !sheet || !['draft', 'returned'].includes(sheet.status)) {
    return NextResponse.json({ error: "Cannot delete a goal unless the sheet is in draft or returned status" }, { status: 400 })
  }

  // 3. Since they own the goal and the sheet is editable, bypass RLS using the admin client to execute delete
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: deleteError } = await supabaseAdmin
    .from('goals')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
