import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeScore } from '@/lib/scoreCalculator'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { sheet_id } = await req.json()

  // Fetch goals and achievements
  const { data: goals } = await supabase
    .from('goals').select('*').eq('goal_sheet_id', sheet_id)

  if (!goals || goals.length === 0) {
    return NextResponse.json({ error: 'No goals found' }, { status: 400 })
  }

  const goalIds = goals.map((g: any) => g.id)
  const { data: achievements } = await supabase
    .from('achievements').select('*')
    .in('goal_id', goalIds)

  // Build per-goal quarterly scores
  const goalFeatures = goals.map((goal: any) => {
    const q1 = achievements?.find((a: any) => a.goal_id === goal.id && a.quarter === 'Q1')
    const q2 = achievements?.find((a: any) => a.goal_id === goal.id && a.quarter === 'Q2')
    return {
      weightage: goal.weightage,
      uom_type: goal.uom_type,
      q1_score: q1 ? computeScore(goal, q1) : 0,
      q2_score: q2 ? computeScore(goal, q2) : 0,
    }
  })

  const q1Weighted = goalFeatures.reduce((s: number, g: any) => s + (g.weightage / 100) * g.q1_score, 0)
  const q2Weighted = goalFeatures.reduce((s: number, g: any) => s + (g.weightage / 100) * g.q2_score, 0)

  // Call AI model
  try {
    const aiRes = await fetch(`${process.env.NEXT_PUBLIC_AI_API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goals: goalFeatures,
        q1_weighted_score: q1Weighted,
        q2_weighted_score: q2Weighted,
      }),
    })
    const prediction = await aiRes.json()

    // Store prediction in DB
    await supabase.from('ai_predictions').insert({
      goal_sheet_id: sheet_id,
      predicted_score: prediction.predicted_score,
      confidence: prediction.confidence,
      input_features: { goals: goalFeatures, q1_weighted_score: q1Weighted, q2_weighted_score: q2Weighted },
    })

    return NextResponse.json(prediction)
  } catch {
    return NextResponse.json({ error: 'AI model unreachable. Is the Python server running on port 5001?' }, { status: 503 })
  }
}
