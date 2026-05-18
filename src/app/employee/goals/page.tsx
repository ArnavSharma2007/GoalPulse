'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GoalForm } from '@/components/GoalForm'
import { WeightageDistributor } from '@/components/WeightageDistributor'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Goal, GoalSheet, Cycle } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Target } from 'lucide-react'

export default function EmployeeGoalsPage() {
  const supabase = createClient()
  const [goals, setGoals] = useState<Goal[]>([])
  const [sheet, setSheet] = useState<GoalSheet | null>(null)
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitErrors, setSubmitErrors] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: cycleData } = await supabase
      .from('cycles').select('*').eq('is_active', true).single()
    setCycle(cycleData)

    let { data: sheetData } = await supabase
      .from('goal_sheets')
      .select('*')
      .eq('employee_id', session.user.id)
      .eq('cycle_id', cycleData?.id)
      .single()

    if (!sheetData && cycleData) {
      const { data: newSheet } = await supabase
        .from('goal_sheets')
        .insert({ employee_id: session.user.id, cycle_id: cycleData.id, status: 'draft' })
        .select().single()
      sheetData = newSheet
    }
    setSheet(sheetData)

    if (sheetData) {
      const { data: goalsData } = await supabase
        .from('goals_with_thrust')
        .select('*')
        .eq('goal_sheet_id', sheetData.id)
      setGoals(goalsData || [])
    }

    setLoading(false)
  }

  async function handleDelete(goalId: string) {
    await fetch(`/api/goals?id=${goalId}`, { method: 'DELETE' })
    loadData()
  }

  async function handleSubmit() {
    setSubmitErrors([])
    const res = await fetch('/api/goals/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheet_id: sheet?.id })
    })
    const data = await res.json()
    if (!res.ok) { setSubmitErrors(data.errors || [data.error]); return }
    await loadData()
  }

  const totalWeight = goals.reduce((s, g) => s + g.weightage, 0)
  const isEditable = sheet?.status === 'draft' || sheet?.status === 'returned'
  
  const statusConfig: Record<string, { bg: string; text: string; label: string; glow: string }> = {
    draft: { bg: 'bg-white/10', text: 'text-slate-300', label: 'Draft', glow: '' },
    submitted: { bg: 'bg-indigo-500/20', text: 'text-indigo-300', label: 'Submitted', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.5)]' },
    approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Approved ✓', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.5)]' },
    returned: { bg: 'bg-amber-500/20', text: 'text-amber-300', label: 'Returned', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.5)]' },
  }
  const status = statusConfig[sheet?.status || 'draft']

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
    </div>
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div 
      className="max-w-4xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Goals</h1>
          <p className="text-slate-400 mt-1">
            {cycle?.name} <span className="mx-2 text-slate-600">|</span> {goals.length}/8 goals <span className="mx-2 text-slate-600">|</span> {totalWeight}% total weightage
          </p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border border-white/10 backdrop-blur-md ${status.bg} ${status.text} ${status.glow} transition-all duration-300`}>
          {status.label}
        </span>
      </motion.div>

      {/* Weightage visual */}
      <motion.div variants={itemVariants}>
        <div className="glass-panel rounded-2xl p-6">
          <WeightageDistributor goals={goals} />
        </div>
      </motion.div>

      {/* Validation errors */}
      <AnimatePresence>
        {submitErrors.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0}}
            animate={{ opacity: 1, height: 'auto'}}
            exit={{ opacity: 0, height: 0}}
            className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 overflow-hidden"
          >
            {submitErrors.map((e, i) => (
              <p key={i} className="text-red-400 text-sm flex items-start gap-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {e}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return reason */}
      <AnimatePresence>
        {sheet?.status === 'returned' && (sheet as any).return_reason && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <p className="font-semibold text-amber-300 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Returned by Manager
            </p>
            <p className="text-amber-100/70 text-sm mt-2">{(sheet as any).return_reason}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals list */}
      <motion.div variants={containerVariants} className="space-y-4">
        {goals.length === 0 && (
          <motion.div variants={itemVariants} className="text-center py-16 glass-card rounded-2xl border-dashed">
            <Target size={48} className="mx-auto mb-4 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
            <p className="text-white font-medium text-lg">No goals added yet</p>
            <p className="text-slate-400 text-sm mt-2">Click "Add Goal" to begin outlining your objectives</p>
          </motion.div>
        )}
        <AnimatePresence>
          {goals.map((goal, idx) => {
            const colors = [
              'border-l-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.1)]',
              'border-l-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]',
              'border-l-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]',
              'border-l-rose-500 shadow-[0_0_20px_rgba(243,64,121,0.1)]',
              'border-l-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.1)]',
              'border-l-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.1)]',
            ]
            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`glass-card border-l-4 ${colors[idx % colors.length]} overflow-hidden glow-border`}>
                  <CardContent className="p-5 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-white text-lg tracking-tight">{goal.title}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="text-xs px-3 py-1 bg-white/5 border border-white/10 text-slate-300 rounded-full backdrop-blur-md">
                            {(goal as any).thrust_area_name || 'No thrust area'}
                          </span>
                          <span className="text-xs px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full backdrop-blur-md">
                            {goal.uom_type.replace('_', ' ')}
                          </span>
                        </div>
                        {goal.description && (
                          <p className="text-sm text-slate-400 mt-3 leading-relaxed">{goal.description}</p>
                        )}
                        <div className="flex gap-6 mt-4">
                          {goal.target_value && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Target</p>
                              <p className="text-sm text-slate-300 font-medium">{Number(goal.target_value).toLocaleString()}</p>
                            </div>
                          )}
                          {goal.target_date && (
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Deadline</p>
                              <p className="text-sm text-slate-300 font-medium">{goal.target_date}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end ml-4">
                        <div className="text-right bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-md">
                          <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
                            {goal.weightage}%
                          </span>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-1">Weight</p>
                        </div>
                        {isEditable && (
                          <button
                            onClick={() => handleDelete(goal.id)}
                            className="mt-3 text-red-400 hover:text-white text-xs border border-red-500/30 hover:bg-red-500/80 rounded-lg px-3 py-1.5 transition-all duration-200"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {/* Actions */}
      <AnimatePresence>
        {isEditable && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex gap-4 pt-4"
          >
            {goals.length < 8 && (
              <Button
                id="add-goal-btn"
                onClick={() => setShowForm(true)}
                variant="outline"
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 transition-colors h-12 px-6 rounded-xl"
              >
                + Add Goal
              </Button>
            )}
            {goals.length > 0 && (
              <Button
                id="submit-goals-btn"
                onClick={handleSubmit}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 h-12 px-8 rounded-xl font-semibold border border-white/10"
              >
                Submit for Approval →
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add goal form modal */}
      {showForm && (
        <GoalForm
          sheetId={sheet?.id || ''}
          onClose={() => setShowForm(false)}
          onSaved={loadData}
        />
      )}
    </motion.div>
  )
}
