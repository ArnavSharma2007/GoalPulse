'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { computeWeightedScore, getScoreColor, getScoreLabel } from '@/lib/scoreCalculator'

export default function ManagerCheckin() {
  const supabase = createClient()
  const [teamSheets, setTeamSheets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: sheets } = await supabase
      .from('goal_sheets_with_users')
      .select('*')
      .eq('manager_id', session.user.id)
      .eq('status', 'approved')

    const enriched = await Promise.all((sheets || []).map(async sheet => {
      const { data: goals } = await supabase.from('goals').select('*').eq('goal_sheet_id', sheet.id)
      const goalIds = (goals || []).map((g: any) => g.id)
      const { data: achievements } = goalIds.length > 0
        ? await supabase.from('achievements').select('*').in('goal_id', goalIds)
        : { data: [] }
      const score = computeWeightedScore(goals || [], achievements || [])
      return { ...sheet, goals: goals || [], achievements: achievements || [], score }
    }))

    setTeamSheets(enriched)
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
          Team Check-in Overview
        </h1>
        <p className="text-sm text-slate-400">
          Monitor your team's current performance metrics and check-in scores.
        </p>
      </div>

      {teamSheets.length === 0 && (
        <div className="text-center py-16 bg-white/5 rounded-3xl border-dashed border border-white/10 backdrop-blur-md shadow-2xl">
          <p className="text-slate-400 text-lg font-medium">No approved goal sheets yet.</p>
          <p className="text-slate-500 text-sm mt-1">Once goal sheets are approved, their check-in scores will appear here.</p>
        </div>
      )}

      <div className="space-y-4">
        {teamSheets.map(sheet => (
          <div 
            key={sheet.id} 
            className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-md hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-300 text-lg shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:scale-105 transition-all">
                  {sheet.employee_name?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-white text-lg group-hover:text-indigo-200 transition-colors">
                    {sheet.employee_name}
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {sheet.department} &middot; <span className="text-slate-500 font-medium">{sheet.goals.length} goals</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-black tracking-tight ${getScoreColor(sheet.score)}`}>
                  {sheet.score || '—'}
                </p>
                <p className={`text-xs uppercase tracking-wider font-bold mt-1 ${getScoreColor(sheet.score)}`}>
                  {sheet.score ? getScoreLabel(sheet.score) : 'No data'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
