'use client'
import { useState, useEffect } from 'react'
import { computeScore, getScoreColor } from '@/lib/scoreCalculator'
import type { Goal, Achievement, Quarter } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, X, Edit3 } from 'lucide-react'

interface Props {
  goal: Goal
  achievements: Achievement[]
  activeQuarter: Quarter | null
  onUpdate: () => void
}

export function CheckinCard({ goal, achievements, activeQuarter, onUpdate }: Props) {
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>('Q1')
  const [editing, setEditing] = useState(false)
  const [actualValue, setActualValue] = useState('')
  const [actualDate, setActualDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const quarters: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4']

  // Auto-set the initial selected quarter to the active quarter if one is open
  useEffect(() => {
    if (activeQuarter) {
      setSelectedQuarter(activeQuarter)
    }
  }, [activeQuarter])

  function getAch(q: Quarter) { return achievements.find(a => a.quarter === q) }

  async function handleSave() {
    setError('')
    setSaving(true)
    const ach = getAch(selectedQuarter)
    const res = await fetch('/api/achievements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: ach?.id || null,
        goal_id: goal.id,
        quarter: selectedQuarter,
        actual_value: goal.uom_type !== 'timeline' ? Number(actualValue) : null,
        actual_date: goal.uom_type === 'timeline' ? actualDate : null,
        status: 'on_track',
      })
    })
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); setSaving(false); return }
    setSaving(false); setEditing(false); setActualValue(''); setActualDate(''); onUpdate()
  }

  const quarterScores = quarters.map(q => {
    const ach = getAch(q)
    return { q, ach, score: ach ? computeScore(goal, ach) : null }
  })

  // Prefill values for the selected quarter
  function startEditing(q: Quarter) {
    const ach = getAch(q)
    if (goal.uom_type === 'timeline') {
      setActualDate(ach?.actual_date || '')
    } else {
      setActualValue(ach?.actual_value != null ? String(ach.actual_value) : '')
    }
    setSelectedQuarter(q)
    setEditing(true)
    setError('')
  }

  return (
    <Card className="overflow-hidden glass-card glow-border transition-all duration-300 hover:shadow-2xl select-none">
      <CardContent className="p-0">
        <div className="px-6 pt-6 pb-5 flex justify-between items-start select-none">
          <div className="flex-1">
            <p className="font-semibold text-white text-lg tracking-tight select-text">{goal.title}</p>
            <div className="flex items-center gap-3 mt-3 select-none">
              <span className="text-xs px-3 py-1 bg-white/5 border border-white/10 text-slate-300 rounded-full backdrop-blur-md">
                {goal.uom_type === 'zero' ? 'Zero Target' :
                 goal.uom_type === 'timeline' ? `Due: ${goal.target_date}` :
                 `Target: ${Number(goal.target_value || 0).toLocaleString()}`}
              </span>
              <span className="text-xs px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full backdrop-blur-md">
                {goal.weightage}% weight
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              if (editing) {
                setEditing(false)
              } else {
                startEditing(selectedQuarter)
              }
            }}
            className={`text-xs px-4 py-2 rounded-xl border font-medium transition-all ml-4 flex items-center gap-2 backdrop-blur-md select-none ${
              editing 
                ? 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700' 
                : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/40 hover:text-white'
            }`}
          >
            {editing ? <><X size={14} /> Cancel</> : <><Edit3 size={14} /> Update {selectedQuarter}</>}
          </button>
        </div>

        <div className="grid grid-cols-4 border-t border-white/10 divide-x divide-white/10 select-none">
          {quarterScores.map(({ q, ach, score }) => {
            const isSelected = q === selectedQuarter
            const isActive = q === activeQuarter
            return (
              <div 
                key={q} 
                onClick={() => startEditing(q)}
                className={`px-4 py-5 text-center cursor-pointer hover:bg-white/5 transition-all relative group/column select-none ${
                  isSelected 
                    ? 'bg-indigo-500/10 border-t-2 border-t-indigo-500' 
                    : isActive 
                    ? 'bg-indigo-500/5' 
                    : 'bg-transparent'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-2 pointer-events-none select-none">
                  <p className={`text-[10px] uppercase tracking-wider font-bold ${
                    isSelected ? 'text-indigo-400 font-extrabold' : isActive ? 'text-indigo-300/80' : 'text-slate-500'
                  }`}>
                    {q}
                  </p>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                </div>

                {score !== null ? (
                  <div className="pointer-events-none select-none">
                    <p className={`text-2xl font-black bg-gradient-to-br text-transparent bg-clip-text drop-shadow-sm ${getScoreColor(score).replace('text-', 'from-').replace('600', '400').replace('500', '400')} to-white`}>
                      {score.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-300 mt-1.5 font-medium">
                      {ach?.actual_value != null ? Number(ach.actual_value).toLocaleString() : ach?.actual_date || '—'}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-700 text-2xl font-bold pointer-events-none select-none">—</p>
                )}
                
                {/* Micro hover edit pencil */}
                <div className="absolute top-2 right-2 opacity-0 group-hover/column:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <Edit3 size={10} className="text-slate-400" />
                </div>
              </div>
            )
          })}
        </div>

        <AnimatePresence>
          {editing && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 bg-slate-950/40 px-6 py-5 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                  <Edit3 size={16} /> Record {selectedQuarter} Achievement
                </p>
              </div>

              {goal.uom_type === 'timeline' ? (
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-slate-400">Actual Completion Date</label>
                  <input type="date" value={actualDate} onChange={e => setActualDate(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all animate-none select-text" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                    {goal.uom_type === 'zero' ? 'Incidents (0 = 100 score)' : `Actual (Target: ${Number(goal.target_value || 0).toLocaleString()})`}
                  </label>
                  <input type="number" value={actualValue} onChange={e => setActualValue(e.target.value)}
                    placeholder="Enter actual value..." 
                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all select-text" />
                </div>
              )}

              {error && (
                <p className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button onClick={handleSave} disabled={saving || (!actualValue && !actualDate)}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 transition-all flex justify-center items-center gap-2">
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Save size={16} /> Save Achievement</>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
