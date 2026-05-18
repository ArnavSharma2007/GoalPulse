'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function EscalationsPage() {
  const supabase = createClient()
  const [rules, setRules] = useState<any[]>([])
  const [runResult, setRunResult] = useState<any>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => { loadRules() }, [])

  async function loadRules() {
    const { data } = await supabase.from('escalation_rules').select('*').order('created_at')
    setRules(data || [])
  }

  async function toggleRule(id: string, current: boolean) {
    await supabase.from('escalation_rules').update({ is_active: !current }).eq('id', id)
    loadRules()
  }

  async function updateThreshold(id: string, days: number) {
    if (days < 1) return
    await supabase.from('escalation_rules').update({ days_threshold: days }).eq('id', id)
    loadRules()
  }

  async function runEscalations() {
    setRunning(true)
    setRunResult(null)
    const res = await fetch('/api/escalations/run', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'gp-cron-2025'}` }
    })
    const data = await res.json()
    setRunResult(data)
    setRunning(false)
  }

  const eventConfig: Record<string, { label: string; icon: string; desc: string }> = {
    goal_not_submitted: { label: 'Goal Not Submitted', icon: '🔔', desc: 'Notify employee (and manager) when goals not submitted' },
    approval_pending: { label: 'Approval Pending', icon: '⏰', desc: 'Remind manager when sheet awaits approval too long' },
    checkin_missed: { label: 'Check-in Missed', icon: '📋', desc: 'Remind employee to update quarterly actuals' },
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Escalation Rules</h1>
          <p className="text-slate-400 text-sm mt-1">Configure automatic email reminders</p>
        </div>
        <Button
          id="run-escalations-btn"
          onClick={runEscalations}
          disabled={running}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {running ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Running...
            </span>
          ) : '▶ Run Escalations Now'}
        </Button>
      </div>

      {runResult && (
        <div className={`rounded-xl p-4 border ${runResult.error ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
          <p className={`font-medium ${runResult.error ? 'text-red-400' : 'text-emerald-400'}`}>
            {runResult.error ? 'Error running escalations' : 'Escalation run complete'}
          </p>
          <p className={`text-sm mt-1 ${runResult.error ? 'text-red-300' : 'text-emerald-300'}`}>
            {runResult.error || `${runResult.processed} notification(s) processed`}
          </p>
          {runResult.results && runResult.results.length > 0 && (
            <div className="mt-2 space-y-1">
              {runResult.results.map((r: any, i: number) => (
                <p key={i} className="text-xs text-emerald-400">
                  {r.sent ? '✓' : '✗'} {r.employee || r.manager} — {r.event || 'notified'}
                  {r.error && ` (${r.error})`}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {rules.map(rule => {
          const config = eventConfig[rule.trigger_event]
          return (
            <Card key={rule.id} className="glass-card border-white/10 bg-white/5">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-start">
                    <span className="text-2xl mt-0.5">{config?.icon}</span>
                    <div>
                      <p className="font-semibold text-white">{config?.label}</p>
                      <p className="text-sm text-slate-400 mt-0.5">{config?.desc}</p>
                      {rule.notify_skip_level && (
                        <span className="text-xs text-indigo-400 mt-1 inline-block">Also notifies skip-level manager</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">After</span>
                      <input
                        type="number"
                        value={rule.days_threshold}
                        onChange={e => updateThreshold(rule.id, parseInt(e.target.value))}
                        className="w-14 border border-white/10 rounded-lg px-2 py-1.5 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-black/40 text-white"
                        min={1}
                      />
                      <span className="text-sm text-slate-400">days</span>
                    </div>
                    <button
                      onClick={() => toggleRule(rule.id, rule.is_active)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        rule.is_active
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {rule.is_active ? '● Active' : '○ Inactive'}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
