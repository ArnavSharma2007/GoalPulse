import { SupabaseClient } from '@supabase/supabase-js'

interface AuditParams {
  tableName: string
  recordId: string
  changedBy: string
  changeType: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}

export async function logAudit(
  supabase: SupabaseClient,
  params: AuditParams
): Promise<void> {
  await supabase.from('audit_log').insert({
    table_name: params.tableName,
    record_id: params.recordId,
    changed_by: params.changedBy,
    change_type: params.changeType,
    old_values: params.oldValues || {},
    new_values: params.newValues || {},
    changed_at: new Date().toISOString(),
  })
}
