import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const sheetId = searchParams.get('sheet_id')

  if (!sheetId) return NextResponse.json({ error: 'sheet_id required' }, { status: 400 })

  // First get goal IDs for this sheet
  const { data: goals } = await supabase
    .from('goals')
    .select('id')
    .eq('goal_sheet_id', sheetId)

  if (!goals || goals.length === 0) return NextResponse.json([])

  const goalIds = goals.map(g => g.id)

  const { data, error } = await supabase
    .from('achievements')
    .select('*, goals(*)')
    .in('goal_id', goalIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const body = await req.json()
  const { id, ...updates } = body

  // 1. Verify access: fetch the achievement using the user's authenticated client
  const { data: ach, error: fetchError } = await supabase
    .from('achievements')
    .select('id, goal_id')
    .eq('id', id)
    .single()

  if (fetchError || !ach) {
    return NextResponse.json({ error: "Achievement not found or unauthorized access" }, { status: 403 })
  }

  // 2. Perform the update using the admin client to bypass any update RLS restrictions
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabaseAdmin
    .from('achievements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
