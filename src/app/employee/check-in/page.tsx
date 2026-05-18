'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckinCard } from '@/components/CheckinCard'
import { computeWeightedScore, getScoreColor, getScoreLabel } from '@/lib/scoreCalculator'
import { getCurrentWindow } from '@/lib/cycleUtils'
import type { Goal, Achievement, Cycle, Quarter } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Bot, CalendarDays, Activity, ClipboardList, Clock, AlertCircle } from 'lucide-react'

export default function CheckinPage() {
  const supabase = createClient()
  const [goals, setGoals] = useState<Goal[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [cycle, setCycle] = useState<Cycle | null>(null)
  const [sheet, setSheet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [prediction, setPrediction] = useState<any>(null)
  const [predicting, setPredicting] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: cycleData } = await supabase.from('cycles').select('*').eq('is_active', true).single()
    setCycle(cycleData)

    const { data: sheetData } = await supabase
      .from('goal_sheets')
      .select('id')
      .eq('employee_id', session.user.id)
      .eq('cycle_id', cycleData?.id)
      .eq('status', 'approved')
      .single()

    setSheet(sheetData)

    if (!sheetData) { setLoading(false); return }

    const { data: goalsData } = await supabase.from('goals').select('*').eq('goal_sheet_id', sheetData.id)
    const goalIds = (goalsData || []).map(g => g.id)
    const { data: achData } = goalIds.length > 0
      ? await supabase.from('achievements').select('*').in('goal_id', goalIds)
      : { data: [] }

    setGoals(goalsData || [])
    setAchievements(achData || [])
    setLoading(false)
  }

  async function handlePredict() {
    if (!sheet) return
    setPredicting(true)
    const res = await fetch('/api/ai/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheet_id: sheet.id })
    })
    const data = await res.json()
    // Add artificial delay for the animation effect
    setTimeout(() => {
      setPrediction(data)
      setPredicting(false)
    }, 1200)
  }

  const currentWindow = cycle ? getCurrentWindow(cycle) : 'closed'
  const currentQuarter = ['Q1','Q2','Q3','Q4'].includes(currentWindow) ? currentWindow as Quarter : null
  const score = computeWeightedScore(goals, achievements)
  const scoreColor = getScoreColor(score).replace('text-', '') // Adapt for dark mode

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
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  if (!goals.length) return (
    <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} className="max-w-4xl mx-auto py-12">
      <div className="text-center py-20 glass-card rounded-3xl border-dashed">
        <ClipboardList size={56} className="mx-auto mb-6 text-slate-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
        <p className="text-white font-semibold text-2xl tracking-tight">No approved goals yet</p>
        <p className="text-slate-400 mt-3 max-w-md mx-auto">Goals must be submitted and approved by your manager before check-ins can begin.</p>
      </div>
    </motion.div>
  )

  return (
    <motion.div 
      className="max-w-4xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Quarterly Check-in</h1>
          <p className="text-slate-400 mt-2 flex items-center gap-2">
            <CalendarDays size={16} /> {cycle?.name}
          </p>
        </div>
        <div className="text-right glass-panel px-6 py-4 rounded-2xl flex items-center gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Live Status</p>
            <p className={`text-sm font-medium bg-gradient-to-r text-transparent bg-clip-text ${
              score >= 100 ? 'from-emerald-400 to-emerald-200' : 
              score >= 70 ? 'from-indigo-400 to-indigo-200' : 
              'from-rose-400 to-rose-200'
            }`}>{getScoreLabel(score)}</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Weighted Score</p>
            <p className={`text-4xl font-bold bg-gradient-to-r text-transparent bg-clip-text drop-shadow-sm ${
              score >= 100 ? 'from-emerald-500 to-emerald-300' : 
              score >= 70 ? 'from-indigo-500 to-indigo-300' : 
              'from-rose-500 to-rose-300'
            }`}>{score}</p>
          </div>
        </div>
      </motion.div>

      {/* Quarter window status */}
      <motion.div variants={itemVariants}>
        {currentQuarter ? (
          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-5 py-4 flex items-center gap-3 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <Activity className="text-indigo-400" size={20} />
            <p className="text-indigo-200 text-sm font-medium">The <span className="font-bold text-white">{currentQuarter}</span> check-in window is currently open</p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 backdrop-blur-md flex items-center gap-3">
            <Clock size={20} className="text-slate-400" />
            <p className="text-slate-400 text-sm">No check-in window is currently open. The window will unlock at the next quarter date.</p>
          </div>
        )}
      </motion.div>

      {/* AI Prediction Widget */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden glass-panel border-indigo-500/30 rounded-3xl p-8 glow-border">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none mix-blend-screen" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none mix-blend-screen" />
          
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Bot className="text-white" size={24} />
              </div>
              <div>
                <p className="font-bold text-xl text-white tracking-tight flex items-center gap-2">
                  AI Year-End Prediction
                  <Sparkles size={16} className="text-purple-400" />
                </p>
                <p className="text-sm text-indigo-300 mt-1 font-medium">Custom-trained XGBoost Model · <span className="text-indigo-400">WMAPE &lt; 15%</span></p>
              </div>
            </div>
            <button
              id="predict-score-btn"
              onClick={handlePredict}
              disabled={predicting}
              className="relative overflow-hidden bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-xl text-sm font-bold disabled:opacity-50 transition-all duration-300 backdrop-blur-md group"
            >
              {predicting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing Momentum...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Predict My Score
                  <Sparkles size={16} className="group-hover:text-purple-300 transition-colors" />
                </span>
              )}
            </button>
          </div>

          <AnimatePresence>
            {prediction && !prediction.error && !predicting && (
              <motion.div 
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto', mt: 32 }}
                className="grid grid-cols-3 gap-6"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-wider text-indigo-300 font-semibold mb-2">Projected Score</p>
                  <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 to-purple-300 drop-shadow-sm">
                    {prediction.predicted_score}
                  </p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-wider text-indigo-300 font-semibold mb-2">Confidence Level</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-white">{Math.round(prediction.confidence * 100)}</p>
                    <p className="text-indigo-400 font-medium">%</p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                  <p className="text-[10px] uppercase tracking-wider text-indigo-300 font-semibold mb-2">Data Processed</p>
                  <p className="text-2xl font-bold text-white mt-1">{prediction.input_quarters}</p>
                  <p className="text-xs text-slate-400 mt-2">Historical momentum matched</p>
                </div>
              </motion.div>
            )}
            
            {prediction?.error && !predicting && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertCircle size={16} />
                {prediction.error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Goals check-in cards */}
      <motion.div variants={containerVariants} className="space-y-6">
        {goals.map(goal => (
          <motion.div key={goal.id} variants={itemVariants}>
            <CheckinCard
              goal={goal}
              achievements={achievements.filter(a => a.goal_id === goal.id)}
              activeQuarter={currentQuarter}
              onUpdate={loadData}
            />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
