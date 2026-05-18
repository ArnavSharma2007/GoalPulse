'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, AlertCircle, CheckCircle } from 'lucide-react'

export default function ApprovalsPage() {
  const supabase = createClient()
  const [sheets, setSheets] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [returnReason, setReturnReason] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadSheets() }, [])

  async function loadSheets() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('goal_sheets_with_users')
      .select('*')
      .eq('manager_id', session.user.id)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })

    setSheets(data || [])
  }

  async function loadGoals(sheetId: string) {
    const { data } = await supabase.from('goals_with_thrust').select('*').eq('goal_sheet_id', sheetId)
    setGoals(data || [])
  }

  async function handleAction(action: 'approve' | 'return') {
    if (!selected) return
    setLoading(true)
    const res = await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, sheet_id: selected.id, return_reason: returnReason })
    })
    if (res.ok) {
      setSelected(null)
      setGoals([])
      setReturnReason('')
      loadSheets()
    }
    setLoading(false)
  }

  const totalWeight = goals.reduce((s: number, g: any) => s + g.weightage, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Pending Approvals</h1>
        <p className="text-slate-400 font-medium mt-2 flex items-center gap-2">
          {sheets.length > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
          {sheets.length} sheet{sheets.length !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      {sheets.length === 0 && (
        <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="text-center py-20 glass-card rounded-3xl border-dashed">
          <CheckCircle size={56} className="mx-auto mb-6 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
          <p className="text-white font-bold text-2xl tracking-tight">All caught up!</p>
          <p className="text-slate-400 mt-2 font-medium">No goal sheets pending review.</p>
        </motion.div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {sheets.map(sheet => (
            <motion.div
              key={sheet.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, mb: 0 }}
              onClick={async () => { setSelected(sheet); await loadGoals(sheet.id) }}
              className={`glass-card rounded-2xl cursor-pointer overflow-hidden transition-all duration-300 ${
                selected?.id === sheet.id ? 'ring-2 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'hover:bg-white/10'
              }`}
            >
              <div className="p-6 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/25">
                    {sheet.employee_name?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-lg text-white tracking-tight">{sheet.employee_name}</p>
                    <p className="text-sm text-slate-400 font-medium">
                      {sheet.department} · <span className="text-indigo-300">Submitted {new Date(sheet.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 font-semibold backdrop-blur-md">Pending Review</Badge>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-panel border-indigo-500/30 rounded-3xl p-8 space-y-6 glow-border relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex justify-between items-center relative z-10 border-b border-white/10 pb-4">
              <h2 className="font-bold text-2xl text-white tracking-tight">{selected.employee_name}'s Goals</h2>
              <span className={`text-sm font-bold px-4 py-1.5 rounded-full backdrop-blur-md border ${Math.abs(totalWeight - 100) < 0.01 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-red-500/20 text-red-300 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}>
                Total Weight: {totalWeight}%
              </span>
            </div>

            <div className="space-y-4 relative z-10">
              {goals.map((g, idx) => {
                const colors = ['bg-indigo-500/5 border-indigo-500/20','bg-emerald-500/5 border-emerald-500/20','bg-amber-500/5 border-amber-500/20','bg-rose-500/5 border-rose-500/20']
                return (
                  <div key={g.id} className={`rounded-2xl p-5 border backdrop-blur-sm ${colors[idx % colors.length]}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white text-lg tracking-tight">{g.title}</p>
                        <div className="flex gap-3 mt-2">
                          <span className="text-xs px-3 py-1 bg-white/5 border border-white/10 rounded-full text-slate-300 font-medium">{g.thrust_area_name || 'No area'}</span>
                          <span className="text-xs px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300 font-medium">{g.uom_type.replace('_',' ')}</span>
                        </div>
                        {g.description && <p className="text-sm text-slate-400 mt-3 leading-relaxed">{g.description}</p>}
                        <div className="flex gap-6 mt-4">
                          {g.target_value && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Target</p>
                              <p className="text-sm text-slate-300 font-medium">{Number(g.target_value).toLocaleString()}</p>
                            </div>
                          )}
                          {g.target_date && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Deadline</p>
                              <p className="text-sm text-slate-300 font-medium">{g.target_date}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right bg-white/5 rounded-xl p-3 border border-white/10 ml-4 backdrop-blur-md shrink-0">
                        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">{g.weightage}%</span>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-1">Weight</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-4 pt-4 relative z-10 border-t border-white/10 mt-6">
              <Button
                id="approve-btn"
                onClick={() => handleAction('approve')}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold h-12 px-8 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center gap-2"
                disabled={loading}
              >
                <Check size={18} /> Approve
              </Button>
              <div className="flex-1 relative group">
                <input
                  id="return-reason-input"
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all backdrop-blur-md placeholder:text-slate-500"
                  placeholder="Provide feedback (required to return sheet)..."
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                />
              </div>
              <Button
                id="return-btn"
                onClick={() => handleAction('return')}
                disabled={loading || !returnReason.trim()}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 font-bold h-12 px-8 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
                variant="outline"
              >
                <X size={18} /> Return
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
