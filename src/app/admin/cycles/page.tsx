import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'

export default async function CyclesPage() {
  const supabase = createClient()
  const { data: cycles } = await supabase.from('cycles').select('*').order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Performance Cycles</h1>
        <p className="text-slate-400 text-sm mt-1">Manage fiscal year cycles and quarter windows</p>
      </div>

      <div className="space-y-4">
        {(cycles || []).map((cycle: any) => (
          <Card key={cycle.id} className={`glass-card border-white/10 bg-white/5 ${cycle.is_active ? 'ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : ''}`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="w-full">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{cycle.name}</h2>
                    {cycle.is_active && (
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full font-bold border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-3">
                    {[
                      { label: 'Phase 1 Open (Goal Setting)', date: cycle.phase1_open },
                      { label: 'Q1 Check-in Opens', date: cycle.q1_open },
                      { label: 'Q2 Check-in Opens', date: cycle.q2_open },
                      { label: 'Q3 Check-in Opens', date: cycle.q3_open },
                      { label: 'Q4 Check-in Opens', date: cycle.q4_open },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between text-sm py-2 border-b border-white/10">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="font-medium text-white ml-4">
                          {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!cycles || cycles.length === 0) && (
          <div className="text-center py-12 glass-card rounded-xl border-dashed">
            <p className="text-slate-400">No cycles found. Run the seed SQL to create FY 2025-26.</p>
          </div>
        )}
      </div>
    </div>
  )
}
