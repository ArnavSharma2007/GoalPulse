import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileCheck2, Files, CheckCircle, BarChart3, ShieldAlert, FileText, CalendarDays } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = createClient()

  const [
    { count: totalUsers },
    { count: pendingApprovals },
    { count: totalSheets },
    { count: approvedSheets },
    { data: recentAudit }
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('goal_sheets').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
    supabase.from('goal_sheets').select('*', { count: 'exact', head: true }),
    supabase.from('goal_sheets').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('audit_log').select('*, users(name)').order('changed_at', { ascending: false }).limit(10)
  ])

  const stats = [
    { label: 'Total Users', value: totalUsers || 0, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: Users, glow: 'shadow-[0_0_15px_rgba(59,130,246,0.1)]' },
    { label: 'Pending Approvals', value: pendingApprovals || 0, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: FileCheck2, glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]' },
    { label: 'Total Sheets', value: totalSheets || 0, color: 'text-slate-300', bg: 'bg-white/5 border-white/10', icon: Files, glow: 'shadow-[0_0_15px_rgba(255,255,255,0.05)]' },
    { label: 'Approved Sheets', value: approvedSheets || 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle, glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]' },
  ]

  const links = [
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, color: 'hover:border-indigo-500/50 hover:bg-indigo-500/10 text-indigo-400' },
    { href: '/admin/escalations', label: 'Escalations', icon: ShieldAlert, color: 'hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-400' },
    { href: '/admin/audit-log', label: 'Audit Log', icon: FileText, color: 'hover:border-slate-500/50 hover:bg-white/10 text-slate-400' },
    { href: '/admin/cycles', label: 'Cycles & Config', icon: CalendarDays, color: 'hover:border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-white/10 backdrop-blur-xl rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-700/20 rounded-full blur-3xl pointer-events-none" />
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Admin Portal</p>
        <h1 className="text-4xl font-bold tracking-tight">GoalPulse Admin</h1>
        <p className="text-slate-300 mt-2 font-medium">System overview and platform governance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`glass-card rounded-3xl p-6 relative overflow-hidden group ${s.glow} ${s.bg} border`}>
              <Icon className={`absolute top-4 right-4 ${s.color} opacity-20 group-hover:opacity-100 transition-opacity duration-300`} size={48} />
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">{s.label}</p>
              <p className={`text-4xl font-bold mt-2 ${s.color} drop-shadow-sm`}>{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-4 gap-6">
        {links.map(link => {
          const Icon = link.icon
          return (
            <a key={link.href} href={link.href} className={`glass-card rounded-2xl p-6 border transition-all text-center group ${link.color}`}>
              <Icon size={32} className="mx-auto mb-3 opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-110 transform duration-300" />
              <p className="text-sm font-bold tracking-wide">{link.label}</p>
            </a>
          )
        })}
      </div>

      {/* Recent audit */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="border-b border-white/10 bg-white/5 pb-4">
          <CardTitle className="text-lg flex justify-between items-center text-white tracking-tight">
            <span className="flex items-center gap-2"><FileText size={18} className="text-indigo-400" /> Recent Audit Activity</span>
            <a href="/admin/audit-log" className="text-sm text-indigo-400 font-medium hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg">View full log →</a>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-black/20">
              <tr>
                {['Time', 'User', 'Action', 'Target Component'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {(recentAudit || []).map((log: any) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-slate-400 text-xs">{new Date(log.changed_at).toLocaleString('en-IN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}</td>
                  <td className="px-6 py-4 font-semibold text-slate-200">{log.users?.name || 'System'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${
                      log.change_type === 'APPROVE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      log.change_type === 'RETURN' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                      'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    }`}>{log.change_type}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-medium flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    {log.table_name}
                  </td>
                </tr>
              ))}
              {(!recentAudit || recentAudit.length === 0) && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">No audit events recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
