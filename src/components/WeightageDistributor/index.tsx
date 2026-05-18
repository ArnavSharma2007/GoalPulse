'use client'
import type { Goal } from '@/types'
import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface Props {
  goals: Goal[]
}

const COLORS = [
  'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]', 
  'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]', 
  'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
  'bg-rose-500 shadow-[0_0_10px_rgba(243,64,121,0.5)]', 
  'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]', 
  'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]',
  'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]', 
  'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]'
]

const DOT_COLORS = [
  'bg-indigo-400', 'bg-emerald-400', 'bg-amber-400',
  'bg-rose-400', 'bg-purple-400', 'bg-cyan-400',
  'bg-orange-400', 'bg-teal-400'
]

export function WeightageDistributor({ goals }: Props) {
  const total = goals.reduce((s, g) => s + g.weightage, 0)
  const isValid = Math.abs(total - 100) < 0.01
  const isEmpty = goals.length === 0

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <p className="font-semibold text-slate-300 uppercase tracking-wider text-sm">Weightage Distribution</p>
        <span className={`text-sm font-bold px-4 py-1.5 rounded-full transition-all backdrop-blur-md border ${
          isEmpty
            ? 'bg-slate-800/50 text-slate-400 border-slate-700/50'
            : isValid
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
            : 'bg-red-500/20 text-red-300 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
        }`}>
          {total}% / 100%
          {isValid && !isEmpty && ' ✓'}
          {!isValid && !isEmpty && ' ✗'}
        </span>
      </div>

      {/* Stacked bar */}
      <div className="h-6 rounded-full bg-slate-900/80 border border-white/5 overflow-hidden flex transition-all">
        {goals.map((goal, i) => (
          <motion.div
            key={goal.id}
            initial={{ width: 0 }}
            animate={{ width: `${goal.weightage}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: i * 0.1 }}
            className={`h-full ${COLORS[i % COLORS.length]}`}
            title={`${goal.title}: ${goal.weightage}%`}
          />
        ))}
        {!isValid && total < 100 && (
          <div className="bg-slate-800 flex-1 transition-all" title={`Remaining: ${(100 - total).toFixed(1)}%`} />
        )}
      </div>

      {/* Legend */}
      {goals.length > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2">
          {goals.map((goal, i) => (
            <div key={goal.id} className="flex items-center gap-3 text-sm text-slate-400 bg-white/5 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${DOT_COLORS[i % DOT_COLORS.length]} shadow-[0_0_8px_currentColor]`} />
              <span className="truncate font-medium">{goal.title}</span>
              <span className="font-bold ml-auto text-white">{goal.weightage}%</span>
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <p className="text-center text-slate-500 text-sm py-3 bg-white/5 rounded-xl border border-white/5">
          Add goals to see weightage distribution
        </p>
      )}

      {!isValid && !isEmpty && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-300 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-3"
        >
          <AlertTriangle size={18} className="text-red-400 shrink-0" />
          <span>
            Adjust weightages to total exactly 100% before submitting
            {total < 100 && <strong className="ml-1 text-white">— need {(100 - total).toFixed(1)}% more</strong>}
            {total > 100 && <strong className="ml-1 text-white">— reduce by {(total - 100).toFixed(1)}%</strong>}
          </span>
        </motion.p>
      )}
    </div>
  )
}
