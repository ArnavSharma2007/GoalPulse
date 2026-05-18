'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { computeWeightedScore, getScoreColor, getScoreLabel } from '@/lib/scoreCalculator'
import { motion } from 'framer-motion'
import { Users, FileCheck2, PenTool, LayoutDashboard } from 'lucide-react'

export default function ManagerDashboard() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [teamStats, setTeamStats] = useState({ total: 0, approved: 0, pending: 0, draft: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data: userData } = await supabase.from('users').select('*').eq('id', session.user.id).single()
    setUser(userData)

    const { data: sheets } = await supabase
      .from('goal_sheets_with_users')
      .select('status')
      .eq('manager_id', session.user.id)

    const stats = { total: sheets?.length || 0, approved: 0, pending: 0, draft: 0 }
    sheets?.forEach((s: any) => {
      if (s.status === 'approved') stats.approved++
      else if (s.status === 'submitted') stats.pending++
      else stats.draft++
    })
    setTeamStats(stats)
    setLoading(false)
  }

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

  return (
    <motion.div 
      className="max-w-5xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border border-white/10 backdrop-blur-xl rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <p className="text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">Manager Portal</p>
        <h1 className="text-4xl font-bold tracking-tight">{user?.name || 'Manager'}</h1>
        <p className="text-indigo-200 mt-2 font-medium">{user?.department} Department</p>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-4 gap-6">
        {[
          { label: 'Team Members', value: teamStats.total, color: 'text-white', icon: Users, glow: 'shadow-[0_0_15px_rgba(255,255,255,0.1)]' },
          { label: 'Approved', value: teamStats.approved, color: 'text-emerald-400', icon: FileCheck2, glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]' },
          { label: 'Pending Review', value: teamStats.pending, color: 'text-amber-400', icon: PenTool, glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]' },
          { label: 'Draft / Returned', value: teamStats.draft, color: 'text-slate-400', icon: LayoutDashboard, glow: 'shadow-[0_0_15px_rgba(148,163,184,0.1)]' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} variants={itemVariants} className={`glass-card rounded-2xl p-6 relative overflow-hidden group ${s.glow}`}>
              <Icon className={`absolute top-4 right-4 ${s.color} opacity-20 group-hover:opacity-100 transition-opacity duration-300`} size={48} />
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">{s.label}</p>
              <p className={`text-4xl font-bold mt-2 ${s.color} drop-shadow-sm`}>{s.value}</p>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-2 gap-6">
        <motion.a 
          variants={itemVariants}
          href="/manager/approvals" 
          className="glass-card rounded-3xl p-8 group flex items-start gap-6 glow-border"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
            <span className="text-3xl">✓</span>
          </div>
          <div>
            <p className="font-bold text-2xl text-white group-hover:text-indigo-400 transition-colors tracking-tight">Review Approvals</p>
            <p className="text-slate-400 mt-2 font-medium">
              {teamStats.pending > 0 ? <span className="text-amber-400 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"/>{teamStats.pending} sheets awaiting review</span> : 'All caught up! No pending approvals.'}
            </p>
          </div>
        </motion.a>

        <motion.a 
          variants={itemVariants}
          href="/manager/check-in" 
          className="glass-card rounded-3xl p-8 group flex items-start gap-6 glow-border"
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
            <span className="text-3xl">📋</span>
          </div>
          <div>
            <p className="font-bold text-2xl text-white group-hover:text-purple-400 transition-colors tracking-tight">Team Check-ins</p>
            <p className="text-slate-400 mt-2 font-medium">View live team progress and score matrices</p>
          </div>
        </motion.a>
      </motion.div>
    </motion.div>
  )
}
