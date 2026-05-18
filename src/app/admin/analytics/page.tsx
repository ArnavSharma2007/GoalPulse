'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Download } from 'lucide-react'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6']

export default function AnalyticsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [qoqData, setQoqData] = useState<any[]>([])
  const [deptData, setDeptData] = useState<any[]>([])
  const [thrustData, setThrustData] = useState<any[]>([])
  const [checkinData, setCheckinData] = useState<any[]>([])

  useEffect(() => { loadAnalytics() }, [])

  async function loadAnalytics() {
    // QoQ scores
    const { data: achievements } = await supabase
      .from('achievements').select('quarter, actual_value')

    const quarterSums: Record<string, { sum: number; count: number }> = { Q1: {sum:0,count:0}, Q2: {sum:0,count:0}, Q3: {sum:0,count:0}, Q4: {sum:0,count:0} }
    achievements?.forEach((a: any) => {
      if (a.actual_value != null && quarterSums[a.quarter]) {
        quarterSums[a.quarter].sum += Number(a.actual_value)
        quarterSums[a.quarter].count++
      }
    })
    setQoqData(Object.entries(quarterSums).map(([q, v]) => ({
      quarter: q,
      avg_score: v.count > 0 ? Math.round(v.sum / v.count) : 0,
    })))

    // Goal submissions by department
    const { data: sheets } = await supabase.from('goal_sheets_with_users').select('department, status')
    const deptMap: Record<string, any> = {}
    sheets?.forEach((s: any) => {
      const dept = s.department || 'Unknown'
      if (!deptMap[dept]) deptMap[dept] = { department: dept, approved: 0, pending: 0, draft: 0 }
      if (s.status === 'approved') deptMap[dept].approved++
      else if (s.status === 'submitted') deptMap[dept].pending++
      else deptMap[dept].draft++
    })
    setDeptData(Object.values(deptMap))

    // Goals by thrust area
    const { data: goals } = await supabase.from('goals_with_thrust').select('thrust_area_name')
    const thrustMap: Record<string, number> = {}
    goals?.forEach((g: any) => {
      const key = g.thrust_area_name || 'Unassigned'
      thrustMap[key] = (thrustMap[key] || 0) + 1
    })
    setThrustData(Object.entries(thrustMap).map(([name, value]) => ({ name, value })))

    // Manager check-in completion
    const { data: managers } = await supabase.from('users').select('id, name').eq('role', 'manager')
    const checkinRows = []
    for (const mgr of (managers || [])) {
      const { count: total } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('manager_id', mgr.id)
      const { count: commented } = await supabase.from('checkin_comments').select('*', { count: 'exact', head: true }).eq('manager_id', mgr.id)
      checkinRows.push({
        manager: mgr.name?.split(' ')[0] || 'Mgr',
        completion: total && total > 0 ? Math.round(((commented || 0) / total) * 100) : 0
      })
    }
    setCheckinData(checkinRows)

    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Organisation-wide performance insights</p>
        </div>
        <a
          id="export-btn"
          href="/api/reports/export"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Download size={16} /> Export Report (.xlsx)
        </a>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* QoQ Trend */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Quarter-on-Quarter Score Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={qoqData}>
                <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 120]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="avg_score" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 5 }} name="Avg Score" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Goal Status by Department */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Goal Submissions by Department</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData}>
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="approved" fill="#10b981" radius={[3,3,0,0]} name="Approved" />
                <Bar dataKey="pending" fill="#f59e0b" radius={[3,3,0,0]} name="Pending" />
                <Bar dataKey="draft" fill="#cbd5e1" radius={[3,3,0,0]} name="Draft" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Thrust Area Distribution */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Goals by Thrust Area</CardTitle></CardHeader>
          <CardContent>
            {thrustData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No goals created yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={thrustData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(props) => `${props.name ?? ''} ${(((props.percent as number) ?? 0) * 100).toFixed(0)}%`}>
                    {thrustData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Manager Check-in Completion */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-slate-700">Manager Check-in Completion (%)</CardTitle></CardHeader>
          <CardContent>
            {checkinData.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No managers found</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={checkinData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="manager" width={80} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="completion" fill="#6366f1" radius={[0, 4, 4, 0]} name="Completion %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
