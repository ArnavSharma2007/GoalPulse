import { createClient } from '@/lib/supabase/server'
import { Navigation } from '@/components/Navigation'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const { data: user } = await supabase.from('users').select('name, role').eq('id', session.user.id).single()
  return (
    <div className="min-h-screen text-slate-100 flex relative">
      <Navigation role="admin" userName={user?.name || ''} />
      <main className="flex-1 ml-64 p-8 relative z-10">{children}</main>
    </div>
  )
}
