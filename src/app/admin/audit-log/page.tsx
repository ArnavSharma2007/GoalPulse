import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'

export default async function AuditLogPage() {
  const supabase = createClient()

  const { data: logs } = await supabase
    .from('audit_log')
    .select('*, users(name, email)')
    .order('changed_at', { ascending: false })
    .limit(100)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Audit Log</h1>
        <p className="text-slate-400 text-sm mt-1">All post-lock changes and approval actions · Last 100 events</p>
      </div>

      <Card className="glass-card overflow-hidden bg-white/5 border-white/10">
        <CardContent className="p-0 overflow-hidden rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-black/20 border-b border-white/10">
              <tr>
                {['Time', 'User', 'Action', 'Table', 'Record', 'Changes'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(logs || []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No audit events recorded yet. Approve or return a goal sheet to see events here.
                  </td>
                </tr>
              )}
              {(logs || []).map((log: any) => (
                <tr key={log.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(log.changed_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 font-semibold text-white">{log.users?.name || 'System'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${
                      log.change_type === 'APPROVE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      log.change_type === 'RETURN' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                      log.change_type === 'ADMIN_UNLOCK' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                      'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    }`}>{log.change_type}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-medium">{log.table_name}</td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                    {log.record_id ? `${log.record_id.slice(0, 8)}…` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {log.new_values && Object.keys(log.new_values).length > 0 ? (
                      <details className="cursor-pointer">
                        <summary className="text-indigo-400 text-xs hover:text-indigo-300 font-medium">View changes</summary>
                        <pre className="text-xs mt-2 bg-black/40 border border-white/10 p-3 rounded-lg overflow-auto max-w-xs text-slate-300">
                          {JSON.stringify(log.new_values, null, 2)}
                        </pre>
                      </details>
                    ) : <span className="text-slate-500 text-xs">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
